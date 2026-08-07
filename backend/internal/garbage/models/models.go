package models

import "time"

// ================================================================
// ENUMS / CONSTANTS
// ================================================================

const (
	// Truck status
	StatusInactive         = "inactive"
	StatusOnRoute          = "on_route"
	StatusSlightlyOffRoute = "slightly_off_route"
	StatusRouteDeviation   = "route_deviation"
	StatusCritical         = "critical_deviation"

	// Deviation severity
	SeverityLow    = "low"
	SeverityMedium = "medium"
	SeverityHigh   = "high"

	// Deviation status
	DevStatusActive       = "active"
	DevStatusResolved     = "resolved"
	DevStatusAcknowledged = "acknowledged"

	// Thresholds
	RouteBufferMeters      = 30.0  // on-route buffer
	LowSeverityMaxMeters   = 100.0 // < 100m = low
	MediumSeverityMaxMeters = 300.0 // < 300m = medium, else high
	GracePeriodSeconds     = 120   // 2-minute grace before creating deviation
	MediumMinSeconds       = 120   // 2 min → medium
	HighMinSeconds         = 300   // 5 min → high
)

// ================================================================
// GARBAGE TRUCK
// ================================================================

type GarbageTruck struct {
	ID                 int        `json:"id"`
	VehicleName        string     `json:"vehicle_name"`
	VehicleType        string     `json:"vehicle_type"`
	RegistrationNumber *string    `json:"registration_number"`
	DriverName         *string    `json:"driver_name"`
	DriverPhone        *string    `json:"driver_phone"`
	GPSDeviceID        *string    `json:"gps_device_id"`
	WardNumber         *string    `json:"ward_number"`
	Status             string     `json:"status"`
	LastLatitude       *float64   `json:"last_latitude"`
	LastLongitude      *float64   `json:"last_longitude"`
	LastSpeed          float64    `json:"last_speed"`
	LastHeading        float64    `json:"last_heading"`
	LastSeen           *time.Time `json:"last_seen"`
	IsActive           bool       `json:"is_active"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

// ================================================================
// GARBAGE ROUTE
// ================================================================

type GarbageRoute struct {
	ID              int       `json:"id"`
	VehicleName     string    `json:"vehicle_name"`
	WardNumber      *string   `json:"ward_number"`
	StreetNames     []string  `json:"street_names"`
	Households      int       `json:"households"`
	Workers         int       `json:"workers"`
	RouteGeoJSON    string    `json:"route_geojson"` // ST_AsGeoJSON result
	TotalLengthM    float64   `json:"total_length_meters"`
	BufferMeters    float64   `json:"buffer_meters"`
	CreatedAt       time.Time `json:"created_at"`
}

// ================================================================
// GPS UPDATE (incoming payload)
// ================================================================

type GPSUpdate struct {
	TruckID    int       `json:"truck_id"`
	GPSDevice  string    `json:"gps_device_id,omitempty"` // alternative identifier
	Latitude   float64   `json:"latitude"`
	Longitude  float64   `json:"longitude"`
	Speed      float64   `json:"speed"`
	Heading    float64   `json:"heading"`
	Accuracy   float64   `json:"accuracy"`
	Altitude   float64   `json:"altitude"`
	Timestamp  time.Time `json:"timestamp"`
}

// ================================================================
// GPS LOG
// ================================================================

type GPSLog struct {
	ID                 int64     `json:"id"`
	TruckID            int       `json:"truck_id"`
	Latitude           float64   `json:"latitude"`
	Longitude          float64   `json:"longitude"`
	Speed              float64   `json:"speed"`
	Heading            float64   `json:"heading"`
	OnRoute            *bool     `json:"on_route"`
	DistanceFromRoute  *float64  `json:"distance_from_route"`
	Timestamp          time.Time `json:"timestamp"`
}

// ================================================================
// ROUTE DEVIATION
// ================================================================

type RouteDeviation struct {
	ID              int        `json:"id"`
	TruckID         int        `json:"truck_id"`
	VehicleName     string     `json:"vehicle_name,omitempty"`
	DriverName      string     `json:"driver_name,omitempty"`
	StartedAt       time.Time  `json:"started_at"`
	EndedAt         *time.Time `json:"ended_at"`
	DurationSeconds *int       `json:"duration_seconds"`
	MaxDistance     float64    `json:"max_distance"`
	StartLatitude   *float64   `json:"start_latitude"`
	StartLongitude  *float64   `json:"start_longitude"`
	LastLatitude    *float64   `json:"last_latitude"`
	LastLongitude   *float64   `json:"last_longitude"`
	Severity        string     `json:"severity"`
	Status          string     `json:"status"`
	Remarks         *string    `json:"remarks"`
	AlertSent       bool       `json:"alert_sent"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// ================================================================
// DEVIATION LOG (brief/low severity)
// ================================================================

type DeviationLog struct {
	ID              int64     `json:"id"`
	TruckID         int       `json:"truck_id"`
	Latitude        float64   `json:"latitude"`
	Longitude       float64   `json:"longitude"`
	Distance        float64   `json:"distance"`
	DurationSeconds int       `json:"duration_seconds"`
	Reason          string    `json:"reason"`
	LoggedAt        time.Time `json:"logged_at"`
}

// ================================================================
// IN-MEMORY DEVIATION TIMER STATE
// ================================================================

type DeviationState struct {
	TruckID        int
	StartedAt      time.Time
	MaxDistance    float64
	LastLatitude   float64
	LastLongitude  float64
	StartLatitude  float64
	StartLongitude float64
	DeviationID    *int // set once DB record is created
}

// ================================================================
// FLEET STATISTICS
// ================================================================

type FleetStats struct {
	TotalTrucks      int `json:"total_trucks"`
	ActiveTrucks     int `json:"active_trucks"`
	OnRouteTrucks    int `json:"on_route_trucks"`
	OffRouteTrucks   int `json:"off_route_trucks"`
	CriticalAlerts   int `json:"critical_alerts"`
	TodayDeviations  int `json:"today_deviations"`
	TotalDeviations  int `json:"total_deviations"`
}

// ================================================================
// GPS CHECK RESULT (returned from spatial query)
// ================================================================

type GPSCheckResult struct {
	OnRoute           bool
	DistanceFromRoute float64 // meters
}

// ================================================================
// WEBSOCKET MESSAGE TYPES
// ================================================================

const (
	WSTruckUpdate    = "truck_update"
	WSDeviation      = "deviation"
	WSFleetStats     = "fleet_stats"
	WSAlert          = "alert"
	WSSimulatorEvent = "simulator_event"
)

type WebSocketMessage struct {
	Type      string      `json:"type"`
	Timestamp time.Time   `json:"timestamp"`
	Payload   interface{} `json:"payload"`
}

type TruckUpdatePayload struct {
	TruckID     int     `json:"truck_id"`
	VehicleName string  `json:"vehicle_name"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Speed       float64 `json:"speed"`
	Status      string  `json:"status"`
	Distance    float64 `json:"distance_from_route"`
}

type DeviationPayload struct {
	DeviationID int     `json:"deviation_id"`
	TruckID     int     `json:"truck_id"`
	VehicleName string  `json:"vehicle_name"`
	DriverName  string  `json:"driver_name"`
	Severity    string  `json:"severity"`
	Distance    float64 `json:"distance_meters"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Message     string  `json:"message"`
}

// ================================================================
// QUERY FILTERS
// ================================================================

type DeviationFilter struct {
	Vehicle  string
	Date     string // YYYY-MM-DD
	Severity string
	Status   string
	Limit    int
	Offset   int
}
