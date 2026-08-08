package handlers

import (
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"civicconnectweb/backend/internal/garbage/models"
	"civicconnectweb/backend/internal/garbage/repository"
	"civicconnectweb/backend/internal/garbage/service"
	ws "civicconnectweb/backend/internal/garbage/websocket"
)

// ================================================================
// GARBAGE MODULE HTTP HANDLERS
// ================================================================

type GarbageHandler struct {
	repo    *repository.GarbageRepository
	service *service.DeviationService
	hub     *ws.Hub
}

func New(repo *repository.GarbageRepository, svc *service.DeviationService, hub *ws.Hub) *GarbageHandler {
	return &GarbageHandler{repo: repo, service: svc, hub: hub}
}

// ================================================================
// GET /api/garbage/trucks
// ================================================================
func (h *GarbageHandler) ListTrucks(c *gin.Context) {
	trucks, err := h.repo.GetAllTrucks(c.Request.Context())
	if err != nil {
		log.Printf("[HANDLER] ListTrucks error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load trucks"})
		return
	}
	if trucks == nil {
		trucks = []models.GarbageTruck{}
	}
	c.JSON(http.StatusOK, trucks)
}

// ================================================================
// GET /api/garbage/trucks/:id
// ================================================================
func (h *GarbageHandler) GetTruck(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid truck id"})
		return
	}
	truck, err := h.repo.GetTruckByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "truck not found"})
		return
	}
	c.JSON(http.StatusOK, truck)
}

// ================================================================
// GET /api/garbage/trucks/:id/history?limit=100
// ================================================================
func (h *GarbageHandler) GetTruckHistory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid truck id"})
		return
	}
	limit := 200
	if l := c.Query("limit"); l != "" {
		if n, e := strconv.Atoi(l); e == nil && n > 0 {
			limit = n
		}
	}
	logs, err := h.repo.GetTruckGPSHistory(c.Request.Context(), id, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load history"})
		return
	}
	if logs == nil {
		logs = []models.GPSLog{}
	}
	c.JSON(http.StatusOK, logs)
}

// ================================================================
// POST /api/gps  — main GPS ingest endpoint
// Body: { "truck_id": 1, "latitude": 10.78, "longitude": 77.83, "speed": 5.2, "heading": 90, "timestamp": "..." }
// ================================================================
func (h *GarbageHandler) IngestGPS(c *gin.Context) {
	var update models.GPSUpdate
	if err := c.ShouldBindJSON(&update); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON body"})
		return
	}

	if update.TruckID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "truck_id is required"})
		return
	}
	if update.Latitude == 0 || update.Longitude == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "latitude and longitude are required"})
		return
	}
	if update.Timestamp.IsZero() {
		update.Timestamp = time.Now().UTC()
	}

	if err := h.service.ProcessGPSUpdate(c.Request.Context(), update); err != nil {
		log.Printf("[GPS] ProcessGPSUpdate error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process GPS update"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// ================================================================
// GET /api/garbage/routes/:vehicle
// Returns GeoJSON of the vehicle's official assigned route
// ================================================================
func (h *GarbageHandler) GetRoute(c *gin.Context) {
	vehicle := strings.ToUpper(c.Param("vehicle"))
	route, err := h.repo.GetRouteByVehicleName(c.Request.Context(), vehicle)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "route not found for vehicle: " + vehicle})
		return
	}
	c.JSON(http.StatusOK, route)
}

// ================================================================
// GET /api/garbage/routes  — all routes as GeoJSON features
// ================================================================
func (h *GarbageHandler) GetAllRoutes(c *gin.Context) {
	routes, err := h.repo.GetAllRoutesGeoJSON(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load routes"})
		return
	}
	c.JSON(http.StatusOK, routes)
}

// ================================================================
// GET /api/garbage/deviations
// Query params: vehicle, date (YYYY-MM-DD), severity, status, limit, offset
// ================================================================
func (h *GarbageHandler) ListDeviations(c *gin.Context) {
	limit, _ := strconv.Atoi(c.Query("limit"))
	offset, _ := strconv.Atoi(c.Query("offset"))
	if limit == 0 {
		limit = 100
	}

	filter := models.DeviationFilter{
		Vehicle:  c.Query("vehicle"),
		Date:     c.Query("date"),
		Severity: c.Query("severity"),
		Status:   c.Query("status"),
		Limit:    limit,
		Offset:   offset,
	}

	devs, err := h.repo.GetDeviations(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load deviations"})
		return
	}
	if devs == nil {
		devs = []models.RouteDeviation{}
	}
	c.JSON(http.StatusOK, devs)
}

// ================================================================
// GET /api/garbage/stats  — fleet summary stats
// ================================================================
func (h *GarbageHandler) GetStats(c *gin.Context) {
	stats, err := h.repo.GetFleetStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load stats"})
		return
	}
	// Add active timer count
	c.JSON(http.StatusOK, gin.H{
		"fleet":               stats,
		"active_grace_timers": h.service.ActiveTimerCount(),
	})
}

// ================================================================
// GET /ws/garbage  — WebSocket live feed
// ================================================================
func (h *GarbageHandler) ServeWS(c *gin.Context) {
	h.hub.ServeWS(c.Writer, c.Request)
}

// ================================================================
// POST /api/garbage/simulate  — GPS simulation trigger
// Body: { "scenario": 1, "truck_id": 1 }
// ================================================================
func (h *GarbageHandler) Simulate(c *gin.Context) {
	var req struct {
		Scenario int `json:"scenario"`
		TruckID  int `json:"truck_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	if req.TruckID == 0 {
		req.TruckID = 1
	}
	if req.Scenario == 0 {
		req.Scenario = 1
	}

	go RunSimulatorScenario(h.service, req.TruckID, req.Scenario)
	c.JSON(http.StatusOK, gin.H{
		"status":   "simulation started",
		"scenario": req.Scenario,
		"truck_id": req.TruckID,
	})
}
