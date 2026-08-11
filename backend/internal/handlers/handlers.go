package handlers

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"civicconnectweb/backend/internal/repository"
)

// ==========================================
// LOGIN HANDLER
// ==========================================

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token    string   `json:"token"`
	Username string   `json:"username"`
	Role     string   `json:"role"`
	Modules  []string `json:"modules"`
}

func LoginHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		var hash, role string
		var modules []string

		// Hybrid Login Logic: Check new schema first (for college server), fallback to app_users (for local)
		
		// 1. Try ae_officers (by phone_number)
		var aeID int
		var aeName string
		err := db.QueryRow("SELECT ae_id, password_hash, ae_name FROM ae_officers WHERE phone_number = $1", req.Username).Scan(&aeID, &hash, &aeName)
		if err == nil {
			// Assign role based on ae_name from DB
			aeName = strings.TrimSpace(aeName)
			switch aeName {
			case "AE 2":
				role = "ae2"
				modules = []string{"Solid Waste", "Survey"}
			case "AE 3":
				role = "ae3"
				modules = []string{"Water Utility", "UGSS", "Street Lighting", "Solid Waste", "Survey"}
			case "AE 4":
				role = "ae4"
				modules = []string{"Water Utility", "UGSS", "Street Lighting", "Solid Waste", "Survey"}
			default:
				role = "ae1"
				modules = []string{"Water Utility", "UGSS", "Street Lighting"}
			}
		} else {
			// 2. Try admin_users
			err = db.QueryRow("SELECT password_hash FROM admin_users WHERE username = $1", req.Username).Scan(&hash)
			if err == nil {
				role = "admin"
				modules = []string{"Water Utility", "UGSS", "Street Lighting", "Solid Waste", "Survey"}
			} else {
				// No matching user found
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
				return
			}
		}

		// Verify password using bcrypt
		if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}

		// Generate JWT token (expires in 72 hours)
		claims := jwt.MapClaims{
			"username": req.Username,
			"role":     role,
			"exp":      time.Now().Add(72 * time.Hour).Unix(),
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		signed, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
		if err != nil {
			log.Printf("Error generating token: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating session token"})
			return
		}

		resp := LoginResponse{
			Token:    signed,
			Username: req.Username,
			Role:     role,
			Modules:  modules,
		}

		c.JSON(http.StatusOK, resp)
	}
}

// ==========================================
// USER HANDLERS
// ==========================================

func GetUserByMobileHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		mobile := c.Query("mobile")
		if mobile == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing mobile parameter"})
			return
		}

		user, err := repository.GetUserByMobile(db, mobile)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, user)
	}
}

func GetUsersByRoleHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.Query("role")
		if role == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing role parameter"})
			return
		}

		userRole := c.Query("userRole")

		users, err := repository.GetUsersByRole(db, role, userRole)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, users)
	}
}

func GetOfficerStatsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.Query("role")
		stats, err := repository.GetOfficerStats(db, role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, stats)
	}
}



// ==========================================
// COMPLAINT HANDLERS
// ==========================================

func GetComplaintsByWardHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ward := c.Query("ward")
		if ward == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing ward parameter"})
			return
		}

		complaints, err := repository.GetComplaintsByWard(db, ward)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, complaints)
	}
}

func GetComplaintsByStatusHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		status := c.Query("status")
		if status == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing status parameter"})
			return
		}

		complaints, err := repository.GetComplaintsByStatus(db, status)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, complaints)
	}
}

func GetStatusCountsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		date := c.Query("date")
		role := c.Query("role")
		data, err := repository.GetStatusCounts(db, date, role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, data)
	}
}

func GetComplaintTypeStatsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		date := c.Query("date")
		role := c.Query("role")
		data, err := repository.GetComplaintTypeStats(db, date, role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, data)
	}
}

func GetEnergyTrendHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		date := c.Query("date")
		data, err := repository.GetEnergyTrend(db, date)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, data)
	}
}

func GetSLATrendHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		date := c.Query("date")
		data, err := repository.GetSLATrend(db, date)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, data)
	}
}

func GetAllComplaintsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		date := c.Query("date")
		role := c.Query("role")
		complaints, err := repository.GetAllComplaints(db, date, role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, complaints)
	}
}

func CreateComplaintHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req repository.CreateComplaintRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
			return
		}
		
		newID, err := repository.CreateComplaint(db, req)
		if err != nil {
			log.Printf("Failed to create complaint: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "Complaint created successfully",
			"id":      newID,
		})
	}
}

// ==========================================
// WORK ORDER HANDLERS
// ==========================================

func GetWorkOrdersByStaffHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		staffIDStr := c.Query("staff_id")
		if staffIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing staff_id parameter"})
			return
		}

		staffID, err := strconv.Atoi(staffIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid staff_id parameter"})
			return
		}

		workOrders, err := repository.GetWorkOrdersByStaff(db, staffID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, workOrders)
	}
}

func GetAllWorkOrdersHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		date := c.Query("date")
		workOrders, err := repository.GetAllWorkOrders(db, date)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, workOrders)
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

func AssignOfficerHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req AssignOfficerRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
			return
		}

		if req.PhoneNumber == "" || req.Name == "" || req.Password == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
			return
		}

		// Hash password
		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Error processing password: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error processing password"})
			return
		}

		tableName := ""
		if req.AssignedBy == "ae1" {
			tableName = "ae1_field_teams"
		} else if req.AssignedBy == "ae2" {
			tableName = "ae2_field_teams"
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assigner role. Must be ae1 or ae2"})
			return
		}

		// Insert into DB
		query := fmt.Sprintf(`
			INSERT INTO %s (phone_number, team_name, password_hash, is_active, created_at)
			VALUES ($1, $2, $3, true, NOW())
		`, tableName)

		_, err = db.ExecContext(c.Request.Context(), query, req.PhoneNumber, req.Name, string(hash))
		if err != nil {
			log.Printf("Failed to assign officer: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"message": "Officer assigned successfully"})
	}
}

// ==========================================
// GET OFFICERS HANDLER
// ==========================================

type OfficerResponse struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func GetOfficersHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.Query("role")
		var query string
		if role == "ae1" {
			query = `SELECT phone_number, team_name FROM ae1_field_teams WHERE is_active = true`
		} else if role == "ae2" {
			query = `SELECT phone_number, team_name FROM ae2_field_teams WHERE is_active = true`
		} else if role == "admin" || role == "citizen" || role == "" {
			query = `SELECT phone_number, team_name FROM ae1_field_teams WHERE is_active = true UNION SELECT phone_number, team_name FROM ae2_field_teams WHERE is_active = true`
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role parameter"})
			return
		}

		rows, err := db.Query(query)
		if err != nil {
			log.Printf("Failed to fetch officers: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
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

		c.JSON(http.StatusOK, officers)
	}
}

// ==========================================
// SURVEY HANDLERS
// ==========================================

func GetHealthSurveyStatsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		stats, err := repository.GetHealthSurveyStats(db)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, stats)
	}
}

func GetWasteSurveyStatsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		stats, err := repository.GetWasteSurveyStats(db)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, stats)
	}
}

// ==========================================
// WARDS HANDLER
// ==========================================

func GetWardsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		wards, err := repository.GetWards(db)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, wards)
	}
}
