package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"ugss-command-center-backend/internal/garbage/models"
	"ugss-command-center-backend/internal/garbage/repository"
	"ugss-command-center-backend/internal/garbage/service"
	ws "ugss-command-center-backend/internal/garbage/websocket"
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

// ── Helper ────────────────────────────────────────────────────────

func respond(w http.ResponseWriter, code int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}

func respondError(w http.ResponseWriter, code int, msg string) {
	respond(w, code, map[string]string{"error": msg})
}

// ================================================================
// GET /api/garbage/trucks
// ================================================================
func (h *GarbageHandler) ListTrucks(w http.ResponseWriter, r *http.Request) {
	trucks, err := h.repo.GetAllTrucks(r.Context())
	if err != nil {
		log.Printf("[HANDLER] ListTrucks error: %v", err)
		respondError(w, http.StatusInternalServerError, "failed to load trucks")
		return
	}
	if trucks == nil {
		trucks = []models.GarbageTruck{}
	}
	respond(w, http.StatusOK, trucks)
}

// ================================================================
// GET /api/garbage/trucks/{id}
// ================================================================
func (h *GarbageHandler) GetTruck(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid truck id")
		return
	}
	truck, err := h.repo.GetTruckByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "truck not found")
		return
	}
	respond(w, http.StatusOK, truck)
}

// ================================================================
// GET /api/garbage/trucks/{id}/history?limit=100
// ================================================================
func (h *GarbageHandler) GetTruckHistory(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid truck id")
		return
	}
	limit := 200
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, e := strconv.Atoi(l); e == nil && n > 0 {
			limit = n
		}
	}
	logs, err := h.repo.GetTruckGPSHistory(r.Context(), id, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to load history")
		return
	}
	if logs == nil {
		logs = []models.GPSLog{}
	}
	respond(w, http.StatusOK, logs)
}

// ================================================================
// POST /api/gps  — main GPS ingest endpoint
// Body: { "truck_id": 1, "latitude": 10.78, "longitude": 77.83, "speed": 5.2, "heading": 90, "timestamp": "..." }
// ================================================================
func (h *GarbageHandler) IngestGPS(w http.ResponseWriter, r *http.Request) {
	var update models.GPSUpdate
	if err := json.NewDecoder(r.Body).Decode(&update); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	if update.TruckID == 0 {
		respondError(w, http.StatusBadRequest, "truck_id is required")
		return
	}
	if update.Latitude == 0 || update.Longitude == 0 {
		respondError(w, http.StatusBadRequest, "latitude and longitude are required")
		return
	}
	if update.Timestamp.IsZero() {
		update.Timestamp = time.Now().UTC()
	}

	if err := h.service.ProcessGPSUpdate(r.Context(), update); err != nil {
		log.Printf("[GPS] ProcessGPSUpdate error: %v", err)
		respondError(w, http.StatusInternalServerError, "failed to process GPS update")
		return
	}

	respond(w, http.StatusOK, map[string]string{"status": "ok"})
}

// ================================================================
// GET /api/garbage/routes/{vehicle}
// Returns GeoJSON of the vehicle's official assigned route
// ================================================================
func (h *GarbageHandler) GetRoute(w http.ResponseWriter, r *http.Request) {
	vehicle := strings.ToUpper(chi.URLParam(r, "vehicle"))
	route, err := h.repo.GetRouteByVehicleName(r.Context(), vehicle)
	if err != nil {
		respondError(w, http.StatusNotFound, "route not found for vehicle: "+vehicle)
		return
	}
	respond(w, http.StatusOK, route)
}

// ================================================================
// GET /api/garbage/routes  — all routes as GeoJSON features
// ================================================================
func (h *GarbageHandler) GetAllRoutes(w http.ResponseWriter, r *http.Request) {
	routes, err := h.repo.GetAllRoutesGeoJSON(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to load routes")
		return
	}
	respond(w, http.StatusOK, routes)
}

// ================================================================
// GET /api/garbage/deviations
// Query params: vehicle, date (YYYY-MM-DD), severity, status, limit, offset
// ================================================================
func (h *GarbageHandler) ListDeviations(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	if limit == 0 {
		limit = 100
	}

	filter := models.DeviationFilter{
		Vehicle:  q.Get("vehicle"),
		Date:     q.Get("date"),
		Severity: q.Get("severity"),
		Status:   q.Get("status"),
		Limit:    limit,
		Offset:   offset,
	}

	devs, err := h.repo.GetDeviations(r.Context(), filter)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to load deviations")
		return
	}
	if devs == nil {
		devs = []models.RouteDeviation{}
	}
	respond(w, http.StatusOK, devs)
}

// ================================================================
// GET /api/garbage/stats  — fleet summary stats
// ================================================================
func (h *GarbageHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.repo.GetFleetStats(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to load stats")
		return
	}
	// Add active timer count
	respond(w, http.StatusOK, map[string]interface{}{
		"fleet":               stats,
		"active_grace_timers": h.service.ActiveTimerCount(),
	})
}

// ================================================================
// GET /ws/garbage  — WebSocket live feed
// ================================================================
func (h *GarbageHandler) ServeWS(w http.ResponseWriter, r *http.Request) {
	h.hub.ServeWS(w, r)
}

// ================================================================
// POST /api/garbage/simulate  — GPS simulation trigger
// Body: { "scenario": 1, "truck_id": 1 }
// ================================================================
func (h *GarbageHandler) Simulate(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Scenario int `json:"scenario"`
		TruckID  int `json:"truck_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.TruckID == 0 {
		req.TruckID = 1
	}
	if req.Scenario == 0 {
		req.Scenario = 1
	}

	go RunSimulatorScenario(h.service, req.TruckID, req.Scenario)
	respond(w, http.StatusOK, map[string]interface{}{
		"status":   "simulation started",
		"scenario": req.Scenario,
		"truck_id": req.TruckID,
	})
}
