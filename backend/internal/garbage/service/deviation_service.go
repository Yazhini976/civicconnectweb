package service

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"ugss-command-center-backend/internal/garbage/models"
	"ugss-command-center-backend/internal/garbage/repository"
	ws "ugss-command-center-backend/internal/garbage/websocket"
)

// ================================================================
// DEVIATION DETECTION SERVICE
// Core engine: processes every GPS update and detects route deviations
// ================================================================

type DeviationService struct {
	repo   *repository.GarbageRepository
	hub    *ws.Hub
	timers sync.Map // map[truckID int]*models.DeviationState
	mu     sync.Mutex
}

func NewDeviationService(repo *repository.GarbageRepository, hub *ws.Hub) *DeviationService {
	return &DeviationService{repo: repo, hub: hub}
}

// ----------------------------------------------------------------
// MAIN ENTRY POINT
// Called for every incoming GPS update
// ----------------------------------------------------------------

func (s *DeviationService) ProcessGPSUpdate(ctx context.Context, update models.GPSUpdate) error {
	// 1. Load truck
	truck, err := s.repo.GetTruckByID(ctx, update.TruckID)
	if err != nil {
		return fmt.Errorf("ProcessGPSUpdate: truck not found: %w", err)
	}

	// 2. Spatial check: is truck on its official GIS route?
	result, err := s.repo.CheckPointOnRoute(ctx, update.TruckID, update.Latitude, update.Longitude)
	if err != nil {
		// No route assigned for this truck — update location only
		log.Printf("[GPS] Truck %s has no route assigned, skipping deviation check", truck.VehicleName)
		return s.updateTruckOnly(ctx, truck, update)
	}

	// 3. Save GPS log
	onRoute := result.OnRoute
	gpsLog := &models.GPSLog{
		TruckID:           update.TruckID,
		Latitude:          update.Latitude,
		Longitude:         update.Longitude,
		Speed:             update.Speed,
		Heading:           update.Heading,
		OnRoute:           &onRoute,
		DistanceFromRoute: &result.DistanceFromRoute,
		Timestamp:         update.Timestamp,
	}
	if err := s.repo.SaveGPSLog(ctx, gpsLog); err != nil {
		log.Printf("[GPS] Failed to save GPS log: %v", err)
	}

	// 4. Determine new status and handle deviation logic
	var newStatus string
	if result.OnRoute {
		newStatus = s.handleOnRoute(ctx, truck, update)
	} else {
		newStatus = s.handleOffRoute(ctx, truck, update, result.DistanceFromRoute)
	}

	// 5. Update truck position and status
	if err := s.repo.UpdateTruckStatus(ctx, truck.ID, newStatus,
		update.Latitude, update.Longitude, update.Speed); err != nil {
		log.Printf("[GPS] Failed to update truck status: %v", err)
	}

	// 6. Broadcast live update via WebSocket
	s.hub.Broadcast(models.WSTruckUpdate, models.TruckUpdatePayload{
		TruckID:     truck.ID,
		VehicleName: truck.VehicleName,
		Latitude:    update.Latitude,
		Longitude:   update.Longitude,
		Speed:       update.Speed,
		Status:      newStatus,
		Distance:    result.DistanceFromRoute,
	})

	return nil
}

// ----------------------------------------------------------------
// ON-ROUTE HANDLER
// ----------------------------------------------------------------

func (s *DeviationService) handleOnRoute(ctx context.Context, truck *models.GarbageTruck, update models.GPSUpdate) string {
	// Check if there was an active deviation — resolve it
	if state, ok := s.timers.Load(truck.ID); ok {
		ds := state.(*models.DeviationState)
		duration := int(time.Since(ds.StartedAt).Seconds())

		if ds.DeviationID != nil {
			// Resolve the active deviation record
			if err := s.repo.ResolveDeviation(ctx, *ds.DeviationID, time.Now()); err != nil {
				log.Printf("[DEV] Failed to resolve deviation %d: %v", *ds.DeviationID, err)
			}
			log.Printf("[DEV] Truck %s returned to route after %ds. Deviation %d resolved.",
				truck.VehicleName, duration, *ds.DeviationID)
		} else {
			// Brief detour — save low-severity log only
			log.Printf("[DEV] Truck %s brief detour %.1fm for %ds — log only.",
				truck.VehicleName, ds.MaxDistance, duration)
			s.repo.SaveDeviationLog(ctx, &models.DeviationLog{
				TruckID:         truck.ID,
				Latitude:        ds.LastLatitude,
				Longitude:       ds.LastLongitude,
				Distance:        ds.MaxDistance,
				DurationSeconds: duration,
				Reason:          "brief_detour",
			})
		}

		// Clear the timer
		s.timers.Delete(truck.ID)
	}

	return models.StatusOnRoute
}

// ----------------------------------------------------------------
// OFF-ROUTE HANDLER
// ----------------------------------------------------------------

func (s *DeviationService) handleOffRoute(
	ctx context.Context,
	truck *models.GarbageTruck,
	update models.GPSUpdate,
	distanceM float64,
) string {
	now := time.Now()

	// Load or create deviation timer state
	var ds *models.DeviationState
	if val, ok := s.timers.Load(truck.ID); ok {
		ds = val.(*models.DeviationState)
	} else {
		// First time off route — start timer
		ds = &models.DeviationState{
			TruckID:        truck.ID,
			StartedAt:      now,
			MaxDistance:    distanceM,
			LastLatitude:   update.Latitude,
			LastLongitude:  update.Longitude,
			StartLatitude:  update.Latitude,
			StartLongitude: update.Longitude,
		}
		s.timers.Store(truck.ID, ds)
		log.Printf("[DEV] Truck %s first off-route at %.1fm. Grace timer started.",
			truck.VehicleName, distanceM)
		return models.StatusSlightlyOffRoute
	}

	// Update max distance and last known position
	if distanceM > ds.MaxDistance {
		ds.MaxDistance = distanceM
	}
	ds.LastLatitude = update.Latitude
	ds.LastLongitude = update.Longitude
	s.timers.Store(truck.ID, ds)

	// How long has the truck been off-route?
	durationSec := int(now.Sub(ds.StartedAt).Seconds())

	// Determine severity
	severity := determineSeverity(durationSec, ds.MaxDistance)
	status := severityToStatus(severity)

	log.Printf("[DEV] Truck %s off-route: %ds elapsed, %.1fm from route, severity=%s",
		truck.VehicleName, durationSec, ds.MaxDistance, severity)

	// ── Grace period: < 2 min AND < 100m → no DB record yet ──
	if durationSec < models.GracePeriodSeconds && ds.MaxDistance < models.LowSeverityMaxMeters {
		return models.StatusSlightlyOffRoute
	}

	// ── Create or update the deviation record ──
	if ds.DeviationID == nil {
		// Create new deviation
		startLat := ds.StartLatitude
		startLng := ds.StartLongitude
		lastLat  := ds.LastLatitude
		lastLng  := ds.LastLongitude

		devID, err := s.repo.CreateDeviation(ctx, &models.RouteDeviation{
			TruckID:        truck.ID,
			StartedAt:      ds.StartedAt,
			MaxDistance:    ds.MaxDistance,
			StartLatitude:  &startLat,
			StartLongitude: &startLng,
			LastLatitude:   &lastLat,
			LastLongitude:  &lastLng,
			Severity:       severity,
			Status:         models.DevStatusActive,
			AlertSent:      false,
		})
		if err != nil {
			log.Printf("[DEV] Failed to create deviation for truck %s: %v", truck.VehicleName, err)
		} else {
			ds.DeviationID = &devID
			s.timers.Store(truck.ID, ds)
			log.Printf("[DEV] Created deviation #%d for truck %s (severity=%s)",
				devID, truck.VehicleName, severity)
		}
	} else {
		// Update existing deviation
		s.repo.UpdateDeviation(ctx, *ds.DeviationID, ds.MaxDistance,
			ds.LastLatitude, ds.LastLongitude, severity, models.DevStatusActive)
	}

	// ── Broadcast alert for medium/high ──
	if severity != models.SeverityLow && ds.DeviationID != nil {
		driverName := ""
		if truck.DriverName != nil {
			driverName = *truck.DriverName
		}
		s.hub.Broadcast(models.WSDeviation, models.DeviationPayload{
			DeviationID: *ds.DeviationID,
			TruckID:     truck.ID,
			VehicleName: truck.VehicleName,
			DriverName:  driverName,
			Severity:    severity,
			Distance:    ds.MaxDistance,
			Latitude:    ds.LastLatitude,
			Longitude:   ds.LastLongitude,
			Message:     fmt.Sprintf("Vehicle %s is %.0fm off-route for %d seconds", truck.VehicleName, ds.MaxDistance, durationSec),
		})

		// Mark alert sent in DB (idempotent)
		s.repo.MarkAlertSent(ctx, *ds.DeviationID)
	}

	return status
}

// ----------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------

func (s *DeviationService) updateTruckOnly(ctx context.Context, truck *models.GarbageTruck, u models.GPSUpdate) error {
	return s.repo.UpdateTruckStatus(ctx, truck.ID, models.StatusOnRoute,
		u.Latitude, u.Longitude, u.Speed)
}

// determineSeverity maps duration+distance to severity level
func determineSeverity(durationSec int, distanceM float64) string {
	switch {
	case durationSec >= models.HighMinSeconds || distanceM >= models.MediumSeverityMaxMeters:
		return models.SeverityHigh
	case durationSec >= models.MediumMinSeconds || distanceM >= models.LowSeverityMaxMeters:
		return models.SeverityMedium
	default:
		return models.SeverityLow
	}
}

func severityToStatus(severity string) string {
	switch severity {
	case models.SeverityHigh:
		return models.StatusCritical
	case models.SeverityMedium:
		return models.StatusRouteDeviation
	default:
		return models.StatusSlightlyOffRoute
	}
}

// ----------------------------------------------------------------
// ACTIVE DEVIATION COUNT (for health checks / stats)
// ----------------------------------------------------------------

func (s *DeviationService) ActiveTimerCount() int {
	count := 0
	s.timers.Range(func(k, v interface{}) bool {
		count++
		return true
	})
	return count
}
