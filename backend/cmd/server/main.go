package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
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

// ── Rate limiter per IP for login endpoint ──────────────────────────────────
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

func loginRateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		if !getLoginLimiter(ip).Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Too many login attempts. Please wait a minute and try again.",
			})
			return
		}
		c.Next()
	}
}

// ── Security headers middleware ─────────────────────────────────────────────
func securityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
		c.Next()
	}
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
	log.Println("✅ Connected to database")

	hub  := garbageWS.NewHub()
	repo := garbageRepo.New(db)
	svc  := garbageService.NewDeviationService(repo, hub)
	gHandler := garbageHandlers.New(repo, svc, hub)
	go hub.Run()
	log.Println("✅ WebSocket hub started")

	r := gin.Default()
	r.Use(securityHeaders())
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:*", "http://127.0.0.1:*"},
		AllowOriginFunc:  func(origin string) bool { return true },
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposeHeaders:    []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300 * time.Second,
	}))

	// ── PUBLIC ROUTES ─────────────────────────────────────────────────────
	r.POST("/api/bG9naW4", loginRateLimit(), handlers.LoginHandler(db))
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "civic-app-backend"})
	})
	r.GET("/api/Y29tcGxhaW50cw", handlers.GetAllComplaintsHandler(db))

	// ── PROTECTED ROUTES (require valid JWT) ──────────────────────────────
	auth := r.Group("/")
	auth.Use(appMiddleware.AuthMiddleware())
	{
		auth.POST("/api/YXNzaWduLW9mZmljZXI", handlers.AssignOfficerHandler(db))
		auth.GET("/api/b2ZmaWNlcnM", handlers.GetOfficersHandler(db))
		auth.GET("/api/dXNlcnMvbW9iaWxl", handlers.GetUserByMobileHandler(db))
		auth.GET("/api/dXNlcnMvcm9sZQ", handlers.GetUsersByRoleHandler(db))

		auth.POST("/api/Y29tcGxhaW50cw", handlers.CreateComplaintHandler(db))
		auth.GET("/api/Y29tcGxhaW50cy93YXJk", handlers.GetComplaintsByWardHandler(db))
		auth.GET("/api/Y29tcGxhaW50cy9zdGF0dXM", handlers.GetComplaintsByStatusHandler(db))
		auth.GET("/api/Y29tcGxhaW50cy9zdGF0cw", handlers.GetStatusCountsHandler(db))
		auth.GET("/api/Y29tcGxhaW50cy90eXBlLXN0YXRz", handlers.GetComplaintTypeStatsHandler(db))

		auth.GET("/api/d29yay1vcmRlcnM", handlers.GetAllWorkOrdersHandler(db))
		auth.GET("/api/d29yay1vcmRlcnMvc3RhZmY", handlers.GetWorkOrdersByStaffHandler(db))

		auth.GET("/api/c3VydmV5cy9oZWFsdGgtc3RhdHM=", handlers.GetHealthSurveyStatsHandler(db))
		auth.GET("/api/c3VydmV5cy93YXN0ZS1zdGF0cw==", handlers.GetWasteSurveyStatsHandler(db))
		auth.GET("/api/ZGFzaGJvYXJkL29mZmljZXItc3RhdHM", handlers.GetOfficerStatsHandler(db))
		auth.GET("/api/d2FyZHM=", handlers.GetWardsHandler(db))
		auth.GET("/api/wards", handlers.GetWardsHandler(db))

		// Garbage sub-routes
		garbage := auth.Group("/api/Z2FyYmFnZQ")
		{
			garbage.GET("/trucks",              gHandler.ListTrucks)
			garbage.GET("/trucks/:id",          gHandler.GetTruck)
			garbage.GET("/trucks/:id/history",  gHandler.GetTruckHistory)
			garbage.GET("/routes",              gHandler.GetAllRoutes)
			garbage.GET("/routes/:vehicle",     gHandler.GetRoute)
			garbage.GET("/deviations",          gHandler.ListDeviations)
			garbage.GET("/stats",               gHandler.GetStats)
			garbage.POST("/simulate",           gHandler.Simulate)
		}

		auth.POST("/api/Z3Bz", gHandler.IngestGPS)
	}

	// WebSocket (public — GPS devices connect here)
	r.GET("/ws/Z2FyYmFnZQ", gHandler.ServeWS)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	log.Printf("🚀 Civic App Backend running on :%s", port)
	log.Printf("   REST API : http://localhost:%s/api/", port)
	log.Printf("   WebSocket: ws://localhost:%s/ws/garbage", port)
	log.Printf("   Health   : http://localhost:%s/health", port)

	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
