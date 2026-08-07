package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"golang.org/x/crypto/bcrypt"

	"ugss-command-center-backend/internal/repository"
)

// ==========================================
// LOGIN HANDLER
// ==========================================

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Username string   `json:"username"`
	Role     string   `json:"role"`
	Modules  []string `json:"modules"`
}

func LoginHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		var hash, role string
		var modulesJSON []byte
		err := db.QueryRow("SELECT password_hash, role, allowed_modules FROM app_users WHERE username = $1", req.Username).Scan(&hash, &role, &modulesJSON)
		if err == sql.ErrNoRows {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		} else if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)); err != nil {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		var modules []string
		if err := json.Unmarshal(modulesJSON, &modules); err != nil {
			http.Error(w, "Error parsing modules", http.StatusInternalServerError)
			return
		}

		resp := LoginResponse{
			Username: req.Username,
			Role:     role,
			Modules:  modules,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}

// ==========================================
// USER HANDLERS
// ==========================================

func GetUserByMobileHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		mobile := r.URL.Query().Get("mobile")
		if mobile == "" {
			http.Error(w, "Missing mobile parameter", http.StatusBadRequest)
			return
		}

		user, err := repository.GetUserByMobile(db, mobile)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
	}
}

func GetUsersByRoleHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		role := r.URL.Query().Get("role")
		if role == "" {
			http.Error(w, "Missing role parameter", http.StatusBadRequest)
			return
		}

		users, err := repository.GetUsersByRole(db, role)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(users)
	}
}

func GetOfficerStatsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stats, err := repository.GetOfficerStats(db)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(stats)
	}
}

func GetAllStationsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stations, err := repository.GetAllStations(db)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(stations)
	}
}

func GetStationsByTypeHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stationType := r.URL.Query().Get("type")
		if stationType == "" {
			http.Error(w, "Missing type parameter", http.StatusBadRequest)
			return
		}

		stations, err := repository.GetStationsByType(db, stationType)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(stations)
	}
}

func GetEquipmentByStationHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stationIDStr := r.URL.Query().Get("station_id")
		if stationIDStr == "" {
			http.Error(w, "Missing station_id parameter", http.StatusBadRequest)
			return
		}

		stationID, err := strconv.Atoi(stationIDStr)
		if err != nil {
			http.Error(w, "Invalid station_id parameter", http.StatusBadRequest)
			return
		}

		equipment, err := repository.GetEquipmentByStation(db, stationID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(equipment)
	}
}

// ==========================================
// COMPLAINT HANDLERS
// ==========================================

func GetComplaintsByWardHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ward := r.URL.Query().Get("ward")
		if ward == "" {
			http.Error(w, "Missing ward parameter", http.StatusBadRequest)
			return
		}

		complaints, err := repository.GetComplaintsByWard(db, ward)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(complaints)
	}
}

func GetComplaintsByStatusHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		status := r.URL.Query().Get("status")
		if status == "" {
			http.Error(w, "Missing status parameter", http.StatusBadRequest)
			return
		}

		complaints, err := repository.GetComplaintsByStatus(db, status)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(complaints)
	}
}

func GetStatusCountsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		date := r.URL.Query().Get("date")
		role := r.URL.Query().Get("role")
		data, err := repository.GetStatusCounts(db, date, role)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	}
}

func GetComplaintTypeStatsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		date := r.URL.Query().Get("date")
		role := r.URL.Query().Get("role")
		data, err := repository.GetComplaintTypeStats(db, date, role)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	}
}

func GetEnergyTrendHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		date := r.URL.Query().Get("date")
		data, err := repository.GetEnergyTrend(db, date)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	}
}

func GetSLATrendHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		date := r.URL.Query().Get("date")
		data, err := repository.GetSLATrend(db, date)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	}
}

func GetAllComplaintsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		date := r.URL.Query().Get("date")
		role := r.URL.Query().Get("role")
		complaints, err := repository.GetAllComplaints(db, date, role)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(complaints)
	}
}

func CreateComplaintHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req repository.CreateComplaintRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid payload", http.StatusBadRequest)
			return
		}
		
		newID, err := repository.CreateComplaint(db, req)
		if err != nil {
			log.Printf("Failed to create complaint: %v", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Complaint created successfully",
			"id":      newID,
		})
	}
}

// ==========================================
// WORK ORDER HANDLERS
// ==========================================

func GetWorkOrdersByStaffHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		staffIDStr := r.URL.Query().Get("staff_id")
		if staffIDStr == "" {
			http.Error(w, "Missing staff_id parameter", http.StatusBadRequest)
			return
		}

		staffID, err := strconv.Atoi(staffIDStr)
		if err != nil {
			http.Error(w, "Invalid staff_id parameter", http.StatusBadRequest)
			return
		}

		workOrders, err := repository.GetWorkOrdersByStaff(db, staffID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(workOrders)
	}
}

func GetAllWorkOrdersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		date := r.URL.Query().Get("date")
		workOrders, err := repository.GetAllWorkOrders(db, date)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(workOrders)
	}
}

// ==========================================
// FAULT HANDLERS
// ==========================================

func GetFaultsByStationHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stationIDStr := r.URL.Query().Get("station_id")
		if stationIDStr == "" {
			http.Error(w, "Missing station_id parameter", http.StatusBadRequest)
			return
		}

		stationID, err := strconv.Atoi(stationIDStr)
		if err != nil {
			http.Error(w, "Invalid station_id parameter", http.StatusBadRequest)
			return
		}

		faults, err := repository.GetFaultsByStation(db, stationID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(faults)
	}
}

func GetPendingFaultsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		date := r.URL.Query().Get("date")
		faults, err := repository.GetPendingFaults(db, date)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(faults)
	}
}

// ==========================================
// DASHBOARD HANDLER (NEW – SAFE ADDITION)
// ==========================================

func GetStationCountsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		counts, err := repository.GetStationCounts(db)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(counts)
	}
}

// ==========================================
// LOG HANDLERS
// ==========================================

func GetLiftingLogsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stationIDStr := r.URL.Query().Get("station_id")
		date := r.URL.Query().Get("date")
		if stationIDStr == "" {
			http.Error(w, "Missing station_id", http.StatusBadRequest)
			return
		}
		stationID, _ := strconv.Atoi(stationIDStr)

		logs, err := repository.GetLiftingLogs(db, stationID, date)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(logs)
	}
}

func GetPumpingLogsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stationIDStr := r.URL.Query().Get("station_id")
		date := r.URL.Query().Get("date")
		if stationIDStr == "" {
			http.Error(w, "Missing station_id", http.StatusBadRequest)
			return
		}
		stationID, _ := strconv.Atoi(stationIDStr)

		logs, err := repository.GetPumpingLogs(db, stationID, date)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(logs)
	}
}

func GetSTPLogsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stationIDStr := r.URL.Query().Get("station_id")
		date := r.URL.Query().Get("date")
		if stationIDStr == "" {
			http.Error(w, "Missing station_id", http.StatusBadRequest)
			return
		}
		stationID, _ := strconv.Atoi(stationIDStr)

		logs, err := repository.GetSTPLogs(db, stationID, date)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(logs)
	}
}

// ==========================================
// ASSIGN OFFICER HANDLER
// ==========================================

type AssignOfficerRequest struct {
	PhoneNumber string `json:"phone_number"`
	Name        string `json:"name"`
	Password    string `json:"password"`
	AssignedBy  string `json:"assigned_by"` // "ae1" or "ae2"
}

func AssignOfficerHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req AssignOfficerRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request payload", http.StatusBadRequest)
			return
		}

		if req.PhoneNumber == "" || req.Name == "" || req.Password == "" {
			http.Error(w, "Missing required fields", http.StatusBadRequest)
			return
		}

		// Hash password
		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Error processing password: %v", err)
			http.Error(w, "Error processing password", http.StatusInternalServerError)
			return
		}

		tableName := ""
		if req.AssignedBy == "ae1" {
			tableName = "ae1_field_teams"
		} else if req.AssignedBy == "ae2" {
			tableName = "ae2_field_teams"
		} else {
			http.Error(w, "Invalid assigner role. Must be ae1 or ae2", http.StatusBadRequest)
			return
		}

		// Insert into DB
		query := fmt.Sprintf(`
			INSERT INTO %s (phone_number, team_name, password_hash, is_active, created_at)
			VALUES ($1, $2, $3, true, NOW())
		`, tableName)

		_, err = db.ExecContext(r.Context(), query, req.PhoneNumber, req.Name, string(hash))
		if err != nil {
			log.Printf("Failed to assign officer: %v", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "Officer assigned successfully"})
	}
}

// ==========================================
// GET OFFICERS HANDLER
// ==========================================

type OfficerResponse struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func GetOfficersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		role := r.URL.Query().Get("role")
		var query string
		if role == "ae1" {
			query = `SELECT phone_number, team_name FROM ae1_field_teams WHERE is_active = true`
		} else if role == "ae2" {
			query = `SELECT phone_number, team_name FROM ae2_field_teams WHERE is_active = true`
		} else if role == "admin" || role == "citizen" || role == "" {
			query = `SELECT phone_number, team_name FROM ae1_field_teams WHERE is_active = true UNION SELECT phone_number, team_name FROM ae2_field_teams WHERE is_active = true`
		} else {
			http.Error(w, "Invalid role parameter", http.StatusBadRequest)
			return
		}

		rows, err := db.Query(query)
		if err != nil {
			log.Printf("Failed to fetch officers: %v", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var officers []OfficerResponse
		for rows.Next() {
			var o OfficerResponse
			if err := rows.Scan(&o.ID, &o.Name); err != nil {
				log.Printf("Failed to scan officer: %v", err)
				continue
			}
			officers = append(officers, o)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(officers)
	}
}

