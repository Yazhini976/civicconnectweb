package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"

	// Existing handlers
	"ugss-command-center-backend/internal/handlers"

	// ── NEW: Garbage Monitoring Module ──
	garbageHandlers "ugss-command-center-backend/internal/garbage/handlers"
	garbageRepo     "ugss-command-center-backend/internal/garbage/repository"
	garbageService  "ugss-command-center-backend/internal/garbage/service"
	garbageWS       "ugss-command-center-backend/internal/garbage/websocket"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Connect to Database
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbHost := os.Getenv("DB_HOST")
		dbUser := os.Getenv("DB_USER")
		dbPass := os.Getenv("DB_PASSWORD")
		dbName := os.Getenv("DB_NAME")
		dbPort := os.Getenv("DB_PORT")
		if dbPort == "" {
			dbPort = "5432"
		}
		if dbHost != "" && dbUser != "" && dbPass != "" && dbName != "" {
			dbURL = "postgres://" + dbUser + ":" + dbPass + "@" + dbHost + ":" + dbPort + "/" + dbName + "?sslmode=disable"
			log.Println("DATABASE_URL constructed from DB_HOST/USER/PASSWORD/NAME")
		} else {
			log.Fatal("DATABASE_URL is not set and cannot be constructed from components")
		}
	}

	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer db.Close()

	// Connection pool tuning
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)

	if err := db.Ping(); err != nil {
		log.Fatalf("Unable to ping database: %v\n", err)
	}
	log.Println("✅ Connected to database")

	// ── Initialise Garbage Module ──────────────────────────────────
	hub   := garbageWS.NewHub()
	repo  := garbageRepo.New(db)
	svc   := garbageService.NewDeviationService(repo, hub)

	gHandler := garbageHandlers.New(repo, svc, hub)

	// Start WebSocket hub in background
	go hub.Run()
	log.Println("✅ WebSocket hub started")

	// ── Router ────────────────────────────────────────────────────
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// ── EXISTING ROUTES (unchanged) ──────────────────────────────
	r.Post("/api/login", handlers.LoginHandler(db))
	r.Post("/api/assign-officer", handlers.AssignOfficerHandler(db))
	r.Get("/api/officers", handlers.GetOfficersHandler(db))
	r.Get("/api/users/mobile", handlers.GetUserByMobileHandler(db))
	r.Get("/api/users/role", handlers.GetUsersByRoleHandler(db))
	r.Get("/api/stations", handlers.GetAllStationsHandler(db))
	r.Get("/api/stations/type", handlers.GetStationsByTypeHandler(db))
	r.Get("/api/equipment", handlers.GetEquipmentByStationHandler(db))
	r.Get("/api/complaints", handlers.GetAllComplaintsHandler(db))
	r.Get("/api/complaints/ward", handlers.GetComplaintsByWardHandler(db))
	r.Get("/api/complaints/status", handlers.GetComplaintsByStatusHandler(db))
	r.Get("/api/complaints/stats", handlers.GetStatusCountsHandler(db))
	r.Get("/api/complaints/type-stats", handlers.GetComplaintTypeStatsHandler(db))
	r.Get("/api/work-orders", handlers.GetAllWorkOrdersHandler(db))
	r.Get("/api/work-orders/staff", handlers.GetWorkOrdersByStaffHandler(db))
	r.Get("/api/faults/station", handlers.GetFaultsByStationHandler(db))
	r.Get("/api/faults/pending", handlers.GetPendingFaultsHandler(db))
	r.Get("/api/logs/lifting", handlers.GetLiftingLogsHandler(db))
	r.Get("/api/logs/pumping", handlers.GetPumpingLogsHandler(db))
	r.Get("/api/logs/stp", handlers.GetSTPLogsHandler(db))
	r.Get("/api/dashboard/station-counts", handlers.GetStationCountsHandler(db))
	r.Get("/api/dashboard/officer-stats", handlers.GetOfficerStatsHandler(db))
	r.Get("/api/energy/trend", handlers.GetEnergyTrendHandler(db))
	r.Get("/api/sla/trend", handlers.GetSLATrendHandler(db))
	r.Post("/api/complaints", handlers.CreateComplaintHandler(db))

	// ── NEW: GARBAGE MONITORING ROUTES ────────────────────────────
	r.Route("/api/garbage", func(r chi.Router) {
		r.Get("/trucks",                gHandler.ListTrucks)
		r.Get("/trucks/{id}",           gHandler.GetTruck)
		r.Get("/trucks/{id}/history",   gHandler.GetTruckHistory)
		r.Get("/routes",                gHandler.GetAllRoutes)
		r.Get("/routes/{vehicle}",      gHandler.GetRoute)
		r.Get("/deviations",            gHandler.ListDeviations)
		r.Get("/stats",                 gHandler.GetStats)
		r.Post("/simulate",             gHandler.Simulate)
	})

	// GPS ingest (separate, as per spec)
	r.Post("/api/gps", gHandler.IngestGPS)

	// WebSocket live feed
	r.Get("/ws/garbage", gHandler.ServeWS)

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"civic-app-backend"}`))
	})

	// ── Start Server ──────────────────────────────────────────────
	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	log.Printf("🚀 Civic App Backend running on :%s", port)
	log.Printf("   REST API : http://localhost:%s/api/", port)
	log.Printf("   WebSocket: ws://localhost:%s/ws/garbage", port)
	log.Printf("   Health   : http://localhost:%s/health", port)

	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
