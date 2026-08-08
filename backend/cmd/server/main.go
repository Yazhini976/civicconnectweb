package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
	"golang.org/x/time/rate"

	"civicconnectweb/backend/internal/handlers"
	appMiddleware "civicconnectweb/backend/internal/middleware"

	garbageHandlers "civicconnectweb/backend/internal/garbage/handlers"
	garbageRepo     "civicconnectweb/backend/internal/garbage/repository"
	garbageService  "civicconnectweb/backend/internal/garbage/service"
	garbageWS       "civicconnectweb/backend/internal/garbage/websocket"
)

// â”€â”€ Rate limiter per IP for login endpoint â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type ipLimiter struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

var (
	loginLimiters = make(map[string]*ipLimiter)
	limiterMu     sync.Mutex
)

func getLoginLimiter(ip string) *rate.Limiter {
	limiterMu.Lock()
	defer limiterMu.Unlock()
	if v, ok := loginLimiters[ip]; ok {
		v.lastSeen = time.Now()
		return v.limiter
	}
	l := rate.NewLimiter(rate.Every(time.Minute), 10)
	loginLimiters[ip] = &ipLimiter{limiter: l, lastSeen: time.Now()}
	return l
}

func loginRateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		if !getLoginLimiter(ip).Allow() {
			http.Error(w, "Too many login attempts. Please wait a minute and try again.", http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// â”€â”€ Security headers middleware â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
		next.ServeHTTP(w, r)
	})
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

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

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)

	if err := db.Ping(); err != nil {
		log.Fatalf("Unable to ping database: %v\n", err)
	}
	log.Println("âœ… Connected to database")

	hub  := garbageWS.NewHub()
	repo := garbageRepo.New(db)
	svc  := garbageService.NewDeviationService(repo, hub)
	gHandler := garbageHandlers.New(repo, svc, hub)
	go hub.Run()
	log.Println("âœ… WebSocket hub started")

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(securityHeaders)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:5173",
			"http://localhost:3000",
			"http://127.0.0.1:5173",
			os.Getenv("FRONTEND_URL"), // Added for deployment
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// â”€â”€ PUBLIC ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	r.With(loginRateLimit).Post("/api/login", handlers.LoginHandler(db))
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"civic-app-backend"}`))
	})

	// â”€â”€ PROTECTED ROUTES (require valid JWT) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	r.Group(func(r chi.Router) {
		r.Use(appMiddleware.AuthMiddleware)

		r.Post("/api/assign-officer", handlers.AssignOfficerHandler(db))
		r.Get("/api/officers", handlers.GetOfficersHandler(db))
		r.Get("/api/users/mobile", handlers.GetUserByMobileHandler(db))
		r.Get("/api/users/role", handlers.GetUsersByRoleHandler(db))

		r.Get("/api/stations", handlers.GetAllStationsHandler(db))
		r.Get("/api/stations/type", handlers.GetStationsByTypeHandler(db))
		r.Get("/api/equipment", handlers.GetEquipmentByStationHandler(db))

		r.Get("/api/complaints", handlers.GetAllComplaintsHandler(db))
		r.Post("/api/complaints", handlers.CreateComplaintHandler(db))
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

		r.Route("/api/garbage", func(r chi.Router) {
			r.Get("/trucks",              gHandler.ListTrucks)
			r.Get("/trucks/{id}",         gHandler.GetTruck)
			r.Get("/trucks/{id}/history", gHandler.GetTruckHistory)
			r.Get("/routes",              gHandler.GetAllRoutes)
			r.Get("/routes/{vehicle}",    gHandler.GetRoute)
			r.Get("/deviations",          gHandler.ListDeviations)
			r.Get("/stats",               gHandler.GetStats)
			r.Post("/simulate",           gHandler.Simulate)
		})

		r.Post("/api/gps", gHandler.IngestGPS)
	})

	// WebSocket (public â€” GPS devices connect here)
	r.Get("/ws/Z2FyYmFnZQ", gHandler.ServeWS)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	log.Printf("ðŸš€ Civic App Backend running on :%s", port)
	log.Printf("   REST API : http://localhost:%s/api/", port)
	log.Printf("   WebSocket: ws://localhost:%s/ws/garbage", port)
	log.Printf("   Health   : http://localhost:%s/health", port)

	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}


