package models

import (
	"time"
)

// ==========================================
// USERS & AUTH
// ==========================================

type User struct {
	ID           string    `json:"id"`
	Username     *string   `json:"username"`
	PasswordHash *string   `json:"-"`
	FullName     *string   `json:"full_name"`
	Role         string    `json:"role"`
	MobileNumber string    `json:"mobile_number"`
	WardNumber   *string   `json:"ward_number"`
	CreatedAt    time.Time `json:"created_at"`
}

type OTPCode struct {
	ID           int       `json:"id"`
	MobileNumber string    `json:"mobile_number"`
	Code         string    `json:"-"`
	Expiry       time.Time `json:"expiry"`
	CreatedAt    time.Time `json:"created_at"`
}

// ==========================================
// STATIONS & EQUIPMENT
// ==========================================

type Station struct {
	ID          int      `json:"id"`
	Name        string   `json:"name"`
	Type        string   `json:"type"`
	WardNumber  *string  `json:"ward_number"`
	Capacity    *float64 `json:"capacity"`
	ProcessType *string  `json:"process_type"`
}

type Equipment struct {
	ID        int     `json:"id"`
	StationID int     `json:"station_id"`
	Name      string  `json:"name"`
	Type      string  `json:"type"`
	Details   *string `json:"details"` // JSONB stored as string
}
type StationCount struct {
	Lifting int64 `json:"lifting"`
	Pumping int64 `json:"pumping"`
	STP     int64 `json:"stp"`
}

// ==========================================
// COMPLAINTS & WORK ORDERS
// ==========================================

type Complaint struct {
	ID                   string     `json:"id"`
	CitizenUserID        *string    `json:"citizen_user_id"`
	CitizenName          *string    `json:"citizen_name"`
	CitizenRole          *string    `json:"citizen_role"`
	WardNumber           *string    `json:"ward_number"`
	StreetName           *string    `json:"street_name"`
	DoorNumber           *string    `json:"door_number"`
	Landmark             *string    `json:"landmark"`
	Category             *string    `json:"category"`
	Type                 *string    `json:"type"`
	AreaType             *string    `json:"area_type"`
	PhotoURL             *string    `json:"photo_url"`
	AudioURL             *string    `json:"audio_url"`
	Status               string     `json:"status"`
	AssignedTo           *string    `json:"assigned_to"`
	CreatedAt            time.Time  `json:"created_at"`
	ExpectedResolutionAt *time.Time `json:"expected_resolution_at"`
	ResolvedAt           *time.Time `json:"resolved_at"`
}

type ComplaintFeedback struct {
	ID                string  `json:"id"`
	ComplaintID       string  `json:"complaint_id"`
	FeedbackText      *string `json:"feedback_text"`
	ServiceRating     *int    `json:"service_rating"`
	WorkQualityRating *int    `json:"work_quality_rating"`
}

type WorkOrder struct {
	ID                string     `json:"id"`
	ComplaintID       string     `json:"complaint_id"`
	StaffID           string     `json:"staff_id"`
	SLADeadline       *time.Time `json:"sla_deadline"`
	WorkType          *string    `json:"work_type"`
	ExpectedDuration  *float64   `json:"expected_duration"`
	SiteReachTime     *time.Time `json:"site_reach_time"`
	CheckinPhotoURL   *string    `json:"checkin_photo_url"`
	SiteDepartTime    *time.Time `json:"site_depart_time"`
	Status            *string    `json:"status"`
	ActionTaken       *string    `json:"action_taken"`
	EquipmentUsed     *string    `json:"equipment_used"`
	MaterialUsed      *string    `json:"material_used"`
	ManpowerCount     *int       `json:"manpower_count"`
	SafetyGearUsed    *bool      `json:"safety_gear_used"`
	HazardDetected    *string    `json:"hazard_detected"`
	BeforePhotoURL    *string    `json:"before_photo_url"`
	AfterPhotoURL     *string    `json:"after_photo_url"`
	PermanentSolution *bool      `json:"permanent_solution"`
	NextAction        *string    `json:"next_action"`
}

type Escalation struct {
	ID          string    `json:"id"`
	ComplaintID *string   `json:"complaint_id"`
	WorkOrderID *string   `json:"work_order_id"`
	TriggerType *string   `json:"trigger_type"`
	TriggerTime time.Time `json:"trigger_time"`
	Level       *string   `json:"level"`
	ReasonType  *string   `json:"reason_type"`
	OfficerID   *string   `json:"officer_id"`
	Remarks     *string   `json:"remarks"`
}

// ==========================================
// FAULTS
// ==========================================

type Fault struct {
	ID                  string     `json:"id"`
	StationID           int        `json:"station_id"`
	EquipmentID         int        `json:"equipment_id"`
	ReportedBy          *string    `json:"reported_by"`
	ReportTime          time.Time  `json:"report_time"`
	FaultType           *string    `json:"fault_type"`
	Severity            *string    `json:"severity"`
	EmergencyShutdown   *bool      `json:"emergency_shutdown"`
	EscalationRequired  *bool      `json:"escalation_required"`
	EscalatedToRole     *string    `json:"escalated_to_role"`
	EscalationReason    *string    `json:"escalation_reason"`
	RectificationStatus string     `json:"rectification_status"`
	RectifiedAt         *time.Time `json:"rectified_at"`
	RectificationRemark *string    `json:"rectification_remark"`
}

// ==========================================
// PROPERTY MASTER
// ==========================================

type PropertyMaster struct {
	ID         int      `json:"id"`
	DoorNo     *string  `json:"door_no"`
	StreetName *string  `json:"street_name"`
	Latitude   *float64 `json:"latitude"`
	Longitude  *float64 `json:"longitude"`
}

// ==========================================
// LIFTING STATION LOGS
// ==========================================

type LiftingDailyLog struct {
	ID              int       `json:"id"`
	StationID       int       `json:"station_id"`
	OperatorID      int       `json:"operator_id"`
	LogDate         time.Time `json:"log_date"`
	ShiftType       *string   `json:"shift_type"`
	EquipmentID     *int      `json:"equipment_id"`
	PumpStatus      *string   `json:"pump_status"`
	HoursReading    *float64  `json:"hours_reading"`
	Voltage         *float64  `json:"voltage"`
	CurrentReading  *float64  `json:"current_reading"`
	VibrationIssue  *bool     `json:"vibration_issue"`
	NoiseIssue      *bool     `json:"noise_issue"`
	LeakageIssue    *bool     `json:"leakage_issue"`
	SumpLevelStatus *string   `json:"sump_level_status"`
	PanelStatus     *string   `json:"panel_status"`
	CleaningDone    *bool     `json:"cleaning_done"`
	Remark          *string   `json:"remark"`
	PhotoURL        *string   `json:"photo_url"`
	CreatedAt       time.Time `json:"created_at"`
}

// ==========================================
// PUMPING STATION LOGS
// ==========================================

type PumpingDailyLog struct {
	ID                int       `json:"id"`
	StationID         int       `json:"station_id"`
	OperatorID        int       `json:"operator_id"`
	LogDate           time.Time `json:"log_date"`
	ShiftType         *string   `json:"shift_type"`
	PumpsRunningCount *int      `json:"pumps_running_count"`
	InletLevelStatus  *string   `json:"inlet_level_status"`
	OutletPressure    *float64  `json:"outlet_pressure"`
	FlowRate          *float64  `json:"flow_rate"`
	Voltage           *float64  `json:"voltage"`
	CurrentReading    *float64  `json:"current_reading"`
	PowerFactor       *float64  `json:"power_factor"`
	VibrationIssue    *bool     `json:"vibration_issue"`
	NoiseIssue        *bool     `json:"noise_issue"`
	LeakageIssue      *bool     `json:"leakage_issue"`
	PanelAlarmStatus  *string   `json:"panel_alarm_status"`
	SumpCleanliness   *string   `json:"sump_cleanliness"`
	ScreenBarCleaned  *bool     `json:"screen_bar_cleaned"`
	Remark            *string   `json:"remark"`
	PhotoURL          *string   `json:"photo_url"`
}

// ==========================================
// STP LOGS
// ==========================================

type STPDailyLog struct {
	ID                  int       `json:"id"`
	StationID           int       `json:"station_id"`
	OperatorID          int       `json:"operator_id"`
	LogDate             time.Time `json:"log_date"`
	InletFlowRate       *float64  `json:"inlet_flow_rate"`
	InletPH             *float64  `json:"inlet_ph"`
	InletBOD            *float64  `json:"inlet_bod"`
	InletCOD            *float64  `json:"inlet_cod"`
	InletTSS            *float64  `json:"inlet_tss"`
	InletOilGrease      *float64  `json:"inlet_oil_grease"`
	InletTemp           *float64  `json:"inlet_temp"`
	InletColorOdour     *string   `json:"inlet_color_odour"`
	DOLevel             *float64  `json:"do_level"`
	MLSS                *float64  `json:"mlss"`
	MCRT                *float64  `json:"mcrt"`
	SV30                *float64  `json:"sv30"`
	FMRatio             *float64  `json:"fm_ratio"`
	BlowerHours         *float64  `json:"blower_hours"`
	SludgeDepth         *float64  `json:"sludge_depth"`
	RASFlow             *float64  `json:"ras_flow"`
	WASFlow             *float64  `json:"was_flow"`
	ScumPresent         *bool     `json:"scum_present"`
	OutletFlowRate      *float64  `json:"outlet_flow_rate"`
	OutletPH            *float64  `json:"outlet_ph"`
	OutletBOD           *float64  `json:"outlet_bod"`
	OutletCOD           *float64  `json:"outlet_cod"`
	OutletTSS           *float64  `json:"outlet_tss"`
	OutletOilGrease     *float64  `json:"outlet_oil_grease"`
	OutletFecalColiform *float64  `json:"outlet_fecal_coliform"`
	ResidualChlorine    *float64  `json:"residual_chlorine"`
	SludgeGenerated     *float64  `json:"sludge_generated"`
	SludgeDried         *float64  `json:"sludge_dried"`
	MoistureContent     *float64  `json:"moisture_content"`
	DisposalMethod      *string   `json:"disposal_method"`
	DryingBedCondition  *string   `json:"drying_bed_condition"`
	PowerKWH            *float64  `json:"power_kwh"`
	EnergyPerMLD        *float64  `json:"energy_per_mld"`
	ChlorineUsage       *float64  `json:"chlorine_usage"`
	PolymerUsage        *float64  `json:"polymer_usage"`
	ChemicalStockStatus *string   `json:"chemical_stock_status"`
}

type OfficerStats struct {
	ID                   string  `json:"id"`
	Name                 string  `json:"name"`
	TotalAssigned        int     `json:"total_assigned"`
	Resolved             int     `json:"resolved"`
	SLACompliancePercent float64 `json:"sla_compliance_percent"`
	Score                float64 `json:"score"`
}

// ==========================================
// NEW DB SCHEMAS FOR CIVICAPPFINAL
// ==========================================

type DBFieldOfficer struct {
	OfficerID   int       `json:"officer_id"`
	ModuleID    int       `json:"module_id"`
	OfficerName string    `json:"officer_name"`
	PhoneNumber string    `json:"phone_number"`
	WardFrom    int       `json:"ward_from"`
	WardTo      int       `json:"ward_to"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
}

type DBComplaintUpdate struct {
	UpdateID    int       `json:"update_id"`
	ComplaintID string    `json:"complaint_id"`
	OfficerID   int       `json:"officer_id"`
	OldStatus   string    `json:"old_status"`
	NewStatus   string    `json:"new_status"`
	Remarks     string    `json:"remarks"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type DBModule struct {
	ModuleID   int    `json:"module_id"`
	ModuleName string `json:"module_name"`
}
