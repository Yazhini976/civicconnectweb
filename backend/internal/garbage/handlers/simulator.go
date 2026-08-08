package handlers

import (
	"context"
	"fmt"
	"log"
	"math"
	"time"

	"civicconnectweb/backend/internal/garbage/models"
	"civicconnectweb/backend/internal/garbage/service"
)

// ================================================================
// GPS SIMULATOR â€” Test scenarios for route deviation detection
// ================================================================
//
// Scenario 1: Normal â€” truck follows assigned route perfectly
// Scenario 2: Brief detour (<2 min) â€” returns, log only
// Scenario 3: Extended deviation (>2 min) â€” Medium alert
// Scenario 4: Critical deviation (>5 min />300m) â€” High alert
// ================================================================

// Base coordinates for PC-1 route (Ward 4)
const (
	baseLat = 10.7850
	baseLng = 77.8250
)

// RunSimulatorScenario starts a simulation in a goroutine
func RunSimulatorScenario(svc *service.DeviationService, truckID, scenario int) {
	ctx := context.Background()
	log.Printf("[SIM] Starting scenario %d for truck %d", scenario, truckID)

	switch scenario {
	case 1:
		simulateNormal(ctx, svc, truckID)
	case 2:
		simulateBriefDetour(ctx, svc, truckID)
	case 3:
		simulateExtendedDeviation(ctx, svc, truckID)
	case 4:
		simulateCriticalDeviation(ctx, svc, truckID)
	default:
		log.Printf("[SIM] Unknown scenario %d", scenario)
	}
}

// â”€â”€ Scenario 1: Normal route following â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
func simulateNormal(ctx context.Context, svc *service.DeviationService, truckID int) {
	log.Println("[SIM] Scenario 1: Normal route â€” no alerts expected")
	// Simulate 20 GPS pings along the route (no deviation)
	for i := 0; i < 20; i++ {
		lat := baseLat + float64(i)*0.0002
		lng := baseLng + float64(i)*0.0001
		sendGPS(ctx, svc, truckID, lat, lng, 12.0)
		time.Sleep(5 * time.Second)
	}
	log.Println("[SIM] Scenario 1 complete â€” truck followed route normally")
}

// â”€â”€ Scenario 2: Brief detour (<2min) â€” returns to route â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
func simulateBriefDetour(ctx context.Context, svc *service.DeviationService, truckID int) {
	log.Println("[SIM] Scenario 2: Brief detour â€” log only, no notification")
	// On route for 5 pings
	for i := 0; i < 5; i++ {
		sendGPS(ctx, svc, truckID, baseLat+float64(i)*0.0002, baseLng, 12.0)
		time.Sleep(5 * time.Second)
	}
	// Detour: 60m off-route for ~60 seconds (5 pings Ã— 5s = 25s, stays < 2min)
	log.Println("[SIM] Brief detour started (50m off-route)")
	for i := 0; i < 5; i++ {
		// ~50 meters east of route
		sendGPS(ctx, svc, truckID, baseLat+0.001, baseLng+0.0006, 8.0)
		time.Sleep(5 * time.Second)
	}
	// Return to route
	log.Println("[SIM] Truck returning to route")
	for i := 0; i < 5; i++ {
		sendGPS(ctx, svc, truckID, baseLat+0.001+float64(i)*0.0002, baseLng, 12.0)
		time.Sleep(5 * time.Second)
	}
	log.Println("[SIM] Scenario 2 complete â€” brief detour logged, no alert sent")
}

// â”€â”€ Scenario 3: Extended deviation (3min) â†’ Medium alert â”€â”€â”€â”€â”€â”€â”€â”€â”€
func simulateExtendedDeviation(ctx context.Context, svc *service.DeviationService, truckID int) {
	log.Println("[SIM] Scenario 3: Extended deviation â€” Medium alert expected")
	// On route for 5 pings
	for i := 0; i < 5; i++ {
		sendGPS(ctx, svc, truckID, baseLat+float64(i)*0.0002, baseLng, 12.0)
		time.Sleep(5 * time.Second)
	}
	// Off route for 35 pings Ã— 5s = 175s (~3 min) â†’ Medium alert
	log.Println("[SIM] Extended deviation started (150m off-route)")
	for i := 0; i < 35; i++ {
		// ~150m north-east of route
		offLat := baseLat + 0.0008 + float64(i)*0.00002
		offLng := baseLng + 0.0015
		sendGPS(ctx, svc, truckID, offLat, offLng, 15.0)
		time.Sleep(5 * time.Second)
	}
	log.Println("[SIM] Scenario 3 complete â€” medium deviation alert triggered")
}

// â”€â”€ Scenario 4: Critical â€” >5min AND >300m â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
func simulateCriticalDeviation(ctx context.Context, svc *service.DeviationService, truckID int) {
	log.Println("[SIM] Scenario 4: Critical deviation â€” High alert expected")
	// On route briefly
	for i := 0; i < 3; i++ {
		sendGPS(ctx, svc, truckID, baseLat, baseLng+float64(i)*0.0002, 10.0)
		time.Sleep(5 * time.Second)
	}
	// Critical off-route: 400m away for 7+ minutes (85 pings Ã— 5s = 425s)
	log.Println("[SIM] CRITICAL deviation started (400m off-route)")
	for i := 0; i < 85; i++ {
		// Simulate truck driving ~400m away and continuing
		offLat := baseLat + 0.0035 + float64(i)*0.00003
		offLng := baseLng + 0.0040 + float64(i)*0.00002
		sendGPS(ctx, svc, truckID, offLat, offLng, 25.0)
		time.Sleep(5 * time.Second)
	}
	log.Println("[SIM] Scenario 4 complete â€” critical alert triggered")
}

// â”€â”€ GPS sender helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
func sendGPS(ctx context.Context, svc *service.DeviationService, truckID int, lat, lng, speed float64) {
	update := models.GPSUpdate{
		TruckID:   truckID,
		Latitude:  lat,
		Longitude: lng,
		Speed:     speed,
		Heading:   calculateHeading(lat, lng),
		Timestamp: time.Now().UTC(),
	}
	if err := svc.ProcessGPSUpdate(ctx, update); err != nil {
		log.Printf("[SIM] GPS update error: %v", err)
	}
	log.Printf("[SIM] GPS â†’ truck=%d lat=%.6f lng=%.6f spd=%.1f",
		truckID, lat, lng, speed)
}

// calculateHeading returns a bearing (0-360) for movement direction
func calculateHeading(lat, lng float64) float64 {
	// Simple approximation: return angle based on position
	return math.Mod(lat*100+lng*100, 360)
}

// FormatScenarioName returns a human-readable scenario name
func FormatScenarioName(scenario int) string {
	names := map[int]string{
		1: "Normal Route Following",
		2: "Brief Detour (<2min)",
		3: "Extended Deviation (Medium Alert)",
		4: "Critical Deviation (High Alert)",
	}
	if n, ok := names[scenario]; ok {
		return n
	}
	return fmt.Sprintf("Scenario %d", scenario)
}


