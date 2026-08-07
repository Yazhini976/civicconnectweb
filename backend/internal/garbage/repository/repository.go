package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"ugss-command-center-backend/internal/garbage/models"
)

// ================================================================
// REPOSITORY
// ================================================================

type GarbageRepository struct {
	db *sql.DB
}

func New(db *sql.DB) *GarbageRepository {
	return &GarbageRepository{db: db}
}

// ----------------------------------------------------------------
// TRUCKS
// ----------------------------------------------------------------

func (r *GarbageRepository) GetAllTrucks(ctx context.Context) ([]models.GarbageTruck, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, vehicle_name, vehicle_type, registration_number, driver_name,
		       driver_phone, gps_device_id, ward_number, status,
		       last_latitude, last_longitude, last_speed, last_heading,
		       last_seen, is_active, created_at, updated_at
		FROM garbage_trucks
		WHERE is_active = true
		ORDER BY vehicle_name`)
	if err != nil {
		return nil, fmt.Errorf("GetAllTrucks: %w", err)
	}
	defer rows.Close()
	return scanTrucks(rows)
}

func (r *GarbageRepository) GetTruckByID(ctx context.Context, id int) (*models.GarbageTruck, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, vehicle_name, vehicle_type, registration_number, driver_name,
		       driver_phone, gps_device_id, ward_number, status,
		       last_latitude, last_longitude, last_speed, last_heading,
		       last_seen, is_active, created_at, updated_at
		FROM garbage_trucks WHERE id = $1`, id)
	t := &models.GarbageTruck{}
	if err := scanTruck(row, t); err != nil {
		return nil, fmt.Errorf("GetTruckByID(%d): %w", id, err)
	}
	return t, nil
}

func (r *GarbageRepository) GetTruckByGPSDevice(ctx context.Context, deviceID string) (*models.GarbageTruck, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, vehicle_name, vehicle_type, registration_number, driver_name,
		       driver_phone, gps_device_id, ward_number, status,
		       last_latitude, last_longitude, last_speed, last_heading,
		       last_seen, is_active, created_at, updated_at
		FROM garbage_trucks WHERE gps_device_id = $1`, deviceID)
	t := &models.GarbageTruck{}
	if err := scanTruck(row, t); err != nil {
		return nil, fmt.Errorf("GetTruckByGPSDevice(%s): %w", deviceID, err)
	}
	return t, nil
}

func (r *GarbageRepository) UpdateTruckStatus(ctx context.Context, id int, status string, lat, lng, speed float64) error {
	now := time.Now()
	_, err := r.db.ExecContext(ctx, `
		UPDATE garbage_trucks
		SET status = $1, last_latitude = $2, last_longitude = $3,
		    last_speed = $4, last_seen = $5, updated_at = $5
		WHERE id = $6`,
		status, lat, lng, speed, now, id)
	return err
}

// ----------------------------------------------------------------
// ROUTES (GIS)
// ----------------------------------------------------------------

func (r *GarbageRepository) GetRouteByVehicleName(ctx context.Context, vehicleName string) (*models.GarbageRoute, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, vehicle_name, ward_number, street_names, households, workers,
		       ST_AsGeoJSON(route_geometry) AS route_geojson,
		       COALESCE(ST_Length(route_geometry::geography), 0) AS total_length_meters,
		       buffer_meters, created_at
		FROM garbage_routes
		WHERE vehicle_name = $1`, vehicleName)

	rt := &models.GarbageRoute{}
	var streetNames []string

	err := row.Scan(
		&rt.ID, &rt.VehicleName, &rt.WardNumber,
		pq.Array(&streetNames),
		&rt.Households, &rt.Workers,
		&rt.RouteGeoJSON, &rt.TotalLengthM, &rt.BufferMeters,
		&rt.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("GetRouteByVehicleName(%s): %w", vehicleName, err)
	}
	rt.StreetNames = streetNames
	return rt, nil
}

func (r *GarbageRepository) GetRouteGeoJSONByTruckID(ctx context.Context, truckID int) (string, error) {
	var geoJSON string
	err := r.db.QueryRowContext(ctx, `
		SELECT ST_AsGeoJSON(gr.route_geometry)
		FROM garbage_routes gr
		JOIN garbage_trucks gt ON gt.vehicle_name = gr.vehicle_name
		WHERE gt.id = $1`, truckID).Scan(&geoJSON)
	return geoJSON, err
}

func (r *GarbageRepository) GetAllRoutesGeoJSON(ctx context.Context) ([]map[string]interface{}, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT gr.vehicle_name, gr.ward_number, gr.households,
		       ST_AsGeoJSON(gr.route_geometry) AS geojson
		FROM garbage_routes gr
		JOIN garbage_trucks gt ON gt.vehicle_name = gr.vehicle_name
		WHERE gt.is_active = true`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var name, ward, geoJSON string
		var hh int
		if err := rows.Scan(&name, &ward, &hh, &geoJSON); err != nil {
			continue
		}
		results = append(results, map[string]interface{}{
			"vehicle_name": name,
			"ward_number":  ward,
			"households":   hh,
			"geojson":      geoJSON,
		})
	}
	return results, nil
}

// ----------------------------------------------------------------
// SPATIAL: On-Route Check (Core PostGIS query)
// ----------------------------------------------------------------

// CheckPointOnRoute returns whether the GPS point is within the
// configured buffer of the truck's assigned route, and the distance.
func (r *GarbageRepository) CheckPointOnRoute(ctx context.Context, truckID int, lat, lng float64) (*models.GPSCheckResult, error) {
	var onRoute bool
	var distanceM float64

	err := r.db.QueryRowContext(ctx, `
		SELECT
		  ST_DWithin(
		    gr.route_geometry::geography,
		    ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
		    gr.buffer_meters
		  ) AS on_route,
		  ST_Distance(
		    gr.route_geometry::geography,
		    ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
		  ) AS distance_meters
		FROM garbage_routes gr
		JOIN garbage_trucks gt ON gt.vehicle_name = gr.vehicle_name
		WHERE gt.id = $3`,
		lat, lng, truckID,
	).Scan(&onRoute, &distanceM)

	if err != nil {
		return nil, fmt.Errorf("CheckPointOnRoute(truck=%d): %w", truckID, err)
	}
	return &models.GPSCheckResult{OnRoute: onRoute, DistanceFromRoute: distanceM}, nil
}

// ----------------------------------------------------------------
// GPS LOGS
// ----------------------------------------------------------------

func (r *GarbageRepository) SaveGPSLog(ctx context.Context, log *models.GPSLog) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO garbage_gps_logs
		  (truck_id, latitude, longitude, speed, heading, on_route, distance_from_route, timestamp)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		log.TruckID, log.Latitude, log.Longitude,
		log.Speed, log.Heading, log.OnRoute, log.DistanceFromRoute,
		log.Timestamp)
	return err
}

func (r *GarbageRepository) GetTruckGPSHistory(ctx context.Context, truckID, limit int) ([]models.GPSLog, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, truck_id, latitude, longitude, speed, heading,
		       on_route, distance_from_route, timestamp
		FROM garbage_gps_logs
		WHERE truck_id = $1
		ORDER BY timestamp DESC
		LIMIT $2`, truckID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.GPSLog
	for rows.Next() {
		var l models.GPSLog
		err := rows.Scan(&l.ID, &l.TruckID, &l.Latitude, &l.Longitude,
			&l.Speed, &l.Heading, &l.OnRoute, &l.DistanceFromRoute, &l.Timestamp)
		if err != nil {
			continue
		}
		logs = append(logs, l)
	}
	return logs, nil
}

// ----------------------------------------------------------------
// DEVIATIONS
// ----------------------------------------------------------------

func (r *GarbageRepository) CreateDeviation(ctx context.Context, d *models.RouteDeviation) (int, error) {
	var id int
	err := r.db.QueryRowContext(ctx, `
		INSERT INTO garbage_deviations
		  (truck_id, started_at, max_distance, start_latitude, start_longitude,
		   last_latitude, last_longitude, severity, status, alert_sent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id`,
		d.TruckID, d.StartedAt, d.MaxDistance,
		d.StartLatitude, d.StartLongitude,
		d.LastLatitude, d.LastLongitude,
		d.Severity, d.Status, d.AlertSent,
	).Scan(&id)
	return id, err
}

func (r *GarbageRepository) UpdateDeviation(ctx context.Context, id int, maxDist float64, lat, lng float64, severity, status string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE garbage_deviations
		SET max_distance = GREATEST(max_distance, $1),
		    last_latitude = $2, last_longitude = $3,
		    severity = $4, status = $5, updated_at = NOW()
		WHERE id = $6`,
		maxDist, lat, lng, severity, status, id)
	return err
}

func (r *GarbageRepository) ResolveDeviation(ctx context.Context, id int, endedAt time.Time) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE garbage_deviations
		SET status = 'resolved', ended_at = $1,
		    duration_seconds = EXTRACT(EPOCH FROM ($1 - started_at))::INTEGER,
		    updated_at = NOW()
		WHERE id = $2`, endedAt, id)
	return err
}

func (r *GarbageRepository) MarkAlertSent(ctx context.Context, id int) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE garbage_deviations
		SET alert_sent = true, notified_at = NOW()
		WHERE id = $1`, id)
	return err
}

func (r *GarbageRepository) GetDeviations(ctx context.Context, f models.DeviationFilter) ([]models.RouteDeviation, error) {
	query := `
		SELECT d.id, d.truck_id, gt.vehicle_name, COALESCE(gt.driver_name,''),
		       d.started_at, d.ended_at, d.duration_seconds, d.max_distance,
		       d.start_latitude, d.start_longitude, d.last_latitude, d.last_longitude,
		       d.severity, d.status, d.remarks, d.alert_sent, d.created_at, d.updated_at
		FROM garbage_deviations d
		JOIN garbage_trucks gt ON gt.id = d.truck_id
		WHERE 1=1`

	args := []interface{}{}
	i := 1

	if f.Vehicle != "" {
		query += fmt.Sprintf(" AND gt.vehicle_name = $%d", i)
		args = append(args, strings.ToUpper(f.Vehicle)); i++
	}
	if f.Date != "" {
		query += fmt.Sprintf(" AND d.started_at::date = $%d", i)
		args = append(args, f.Date); i++
	}
	if f.Severity != "" {
		query += fmt.Sprintf(" AND d.severity = $%d", i)
		args = append(args, f.Severity); i++
	}
	if f.Status != "" {
		query += fmt.Sprintf(" AND d.status = $%d", i)
		args = append(args, f.Status); i++
	}

	query += " ORDER BY d.started_at DESC"
	if f.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", i)
		args = append(args, f.Limit); i++
	}
	if f.Offset > 0 {
		query += fmt.Sprintf(" OFFSET $%d", i)
		args = append(args, f.Offset)
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("GetDeviations: %w", err)
	}
	defer rows.Close()

	var devs []models.RouteDeviation
	for rows.Next() {
		var d models.RouteDeviation
		err := rows.Scan(
			&d.ID, &d.TruckID, &d.VehicleName, &d.DriverName,
			&d.StartedAt, &d.EndedAt, &d.DurationSeconds, &d.MaxDistance,
			&d.StartLatitude, &d.StartLongitude, &d.LastLatitude, &d.LastLongitude,
			&d.Severity, &d.Status, &d.Remarks, &d.AlertSent,
			&d.CreatedAt, &d.UpdatedAt,
		)
		if err != nil {
			continue
		}
		devs = append(devs, d)
	}
	return devs, nil
}

// ----------------------------------------------------------------
// DEVIATION LOGS (brief low-severity events)
// ----------------------------------------------------------------

func (r *GarbageRepository) SaveDeviationLog(ctx context.Context, log *models.DeviationLog) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO garbage_deviation_logs
		  (truck_id, latitude, longitude, distance, duration_seconds, reason)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		log.TruckID, log.Latitude, log.Longitude,
		log.Distance, log.DurationSeconds, log.Reason)
	return err
}

// ----------------------------------------------------------------
// FLEET STATS
// ----------------------------------------------------------------

func (r *GarbageRepository) GetFleetStats(ctx context.Context) (*models.FleetStats, error) {
	var stats models.FleetStats
	err := r.db.QueryRowContext(ctx, `
		SELECT
		  COUNT(*) FILTER (WHERE is_active)                                  AS total,
		  COUNT(*) FILTER (WHERE status != 'inactive' AND is_active)         AS active,
		  COUNT(*) FILTER (WHERE status = 'on_route')                        AS on_route,
		  COUNT(*) FILTER (WHERE status IN ('slightly_off_route','route_deviation','critical_deviation')) AS off_route,
		  COUNT(*) FILTER (WHERE status = 'critical_deviation')              AS critical
		FROM garbage_trucks`).Scan(
		&stats.TotalTrucks, &stats.ActiveTrucks,
		&stats.OnRouteTrucks, &stats.OffRouteTrucks, &stats.CriticalAlerts)
	if err != nil {
		return nil, err
	}

	// Today's deviations
	r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM garbage_deviations
		WHERE started_at::date = CURRENT_DATE`).Scan(&stats.TodayDeviations)

	r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM garbage_deviations`).Scan(&stats.TotalDeviations)

	return &stats, nil
}

// ----------------------------------------------------------------
// HELPERS — scanner functions
// ----------------------------------------------------------------

func scanTrucks(rows *sql.Rows) ([]models.GarbageTruck, error) {
	var trucks []models.GarbageTruck
	for rows.Next() {
		var t models.GarbageTruck
		if err := scanTruck(rows, &t); err != nil {
			continue
		}
		trucks = append(trucks, t)
	}
	return trucks, rows.Err()
}

// scanTruck works for both *sql.Row and *sql.Rows via the Scanner interface
func scanTruck(s interface {
	Scan(...interface{}) error
}, t *models.GarbageTruck) error {
	return s.Scan(
		&t.ID, &t.VehicleName, &t.VehicleType, &t.RegistrationNumber,
		&t.DriverName, &t.DriverPhone, &t.GPSDeviceID, &t.WardNumber,
		&t.Status, &t.LastLatitude, &t.LastLongitude, &t.LastSpeed,
		&t.LastHeading, &t.LastSeen, &t.IsActive, &t.CreatedAt, &t.UpdatedAt,
	)
}

// pq is a simple array helper (avoids importing lib/pq for just array scan)
type pqArray struct{ a *[]string }

func (pq pqArray) Scan(src interface{}) error {
	if src == nil {
		*pq.a = []string{}
		return nil
	}
	str, ok := src.(string)
	if !ok {
		if b, ok2 := src.([]byte); ok2 {
			str = string(b)
		} else {
			return fmt.Errorf("cannot scan %T into []string", src)
		}
	}
	// PostgreSQL array format: {elem1,elem2,...}
	str = strings.Trim(str, "{}")
	if str == "" {
		*pq.a = []string{}
		return nil
	}
	*pq.a = strings.Split(str, ",")
	return nil
}

// wrapper so we can write pq.Array(&slice)
type pqArrayWrapper struct{}

var pq = pqArrayWrapper{}

func (pqArrayWrapper) Array(a *[]string) pqArray {
	return pqArray{a: a}
}
