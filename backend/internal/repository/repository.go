package repository

import (
	"database/sql"
	"fmt"
	"strings"
	"time"
	"civicconnectweb/backend/internal/models"
)

// Helper function to return pointer to a value
func ptr[T any](v T) *T {
	return &v
}

// Static mock stations representing the layout structure
var mockStations = []models.Station{
	{ID: 1, Name: "Kothankulam Road LS", Type: "lifting", WardNumber: ptr("5"), Capacity: ptr(10.5), ProcessType: ptr("SBR")},
	{ID: 2, Name: "Samandhapuram LS", Type: "lifting", WardNumber: ptr("12"), Capacity: ptr(8.2), ProcessType: ptr("SBR")},
	{ID: 3, Name: "Chandhoorani LS", Type: "lifting", WardNumber: ptr("18"), Capacity: ptr(12.0), ProcessType: ptr("SBR")},
	{ID: 4, Name: "Thiruvananthapuram Street LS", Type: "lifting", WardNumber: ptr("28"), Capacity: ptr(15.5), ProcessType: ptr("SBR")},
	{ID: 5, Name: "North Avarampatti PS", Type: "pumping", WardNumber: ptr("8"), Capacity: ptr(25.0), ProcessType: ptr("ASP")},
	{ID: 6, Name: "Indira Nagar PS", Type: "pumping", WardNumber: ptr("15"), Capacity: ptr(30.0), ProcessType: ptr("ASP")},
	{ID: 7, Name: "Konthankulam STP", Type: "stp", WardNumber: ptr("10"), Capacity: ptr(50.0), ProcessType: ptr("SBR")},
	{ID: 8, Name: "South Zone STP", Type: "stp", WardNumber: ptr("20"), Capacity: ptr(40.0), ProcessType: ptr("SBR")},
}

// ==========================================
// USER REPOSITORY
// ==========================================

func GetUserByMobile(db *sql.DB, mobile string) (*models.User, error) {
	var user models.User
	var phone string
	err := db.QueryRow(`
		SELECT user_id::text, phone_number, name, created_at 
		FROM users WHERE phone_number = $1
	`, mobile).Scan(&user.ID, &phone, &user.Role, &user.CreatedAt)

	if err != nil {
		return nil, err
	}
	user.Username = &phone
	user.FullName = &phone
	user.MobileNumber = phone
	return &user, nil
}

func GetUsersByRole(db *sql.DB, role string, userRole string) ([]models.User, error) {
	var rows *sql.Rows
	var err error

	if strings.ToUpper(role) == "FIELD_OFFICER" {
		if userRole == "ae1" {
			rows, err = db.Query(`
				SELECT phone_number as id, phone_number, 'FIELD_OFFICER' as role, created_at, team_name as officer_name, '' as ward_number
				FROM ae1_field_teams WHERE is_active = true
			`)
		} else if userRole == "ae2" {
			rows, err = db.Query(`
				SELECT phone_number as id, phone_number, 'FIELD_OFFICER' as role, created_at, team_name as officer_name, '' as ward_number
				FROM ae2_field_teams WHERE is_active = true
			`)
		} else {
			rows, err = db.Query(`
				SELECT phone_number as id, phone_number, 'FIELD_OFFICER' as role, created_at, team_name as officer_name, '' as ward_number
				FROM ae1_field_teams WHERE is_active = true
				UNION ALL
				SELECT phone_number as id, phone_number, 'FIELD_OFFICER' as role, created_at, team_name as officer_name, '' as ward_number
				FROM ae2_field_teams WHERE is_active = true
			`)
		}
	} else {
		rows, err = db.Query(`
			SELECT user_id::text, phone_number, '' as role, created_at, name as officer_name, '' as ward_number
			FROM users WHERE false
		`)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		var phone string
		var fullName string
		var ward string
		if err := rows.Scan(&u.ID, &phone, &u.Role, &u.CreatedAt, &fullName, &ward); err != nil {
			return nil, err
		}
		u.Username = &phone
		u.FullName = &fullName
		u.MobileNumber = phone
		if ward != "" && ward != "0-0" {
			u.WardNumber = &ward
		}
		users = append(users, u)
	}
	return users, nil
}

func GetOfficerStats(db *sql.DB, role string) ([]models.OfficerStats, error) {
	var query string
	if role == "ae1" {
		query = `
		SELECT 
			a.phone_number as id,
			a.team_name as name,
			COUNT(c.complaint_id) as total_assigned,
			COUNT(c.complaint_id) FILTER (WHERE UPPER(c.status) IN ('COMPLETED', 'RESOLVED')) as resolved
		FROM ae1_field_teams a
		LEFT JOIN complaints c ON c.assigned_officer_phone = a.phone_number
		GROUP BY a.phone_number, a.team_name
		ORDER BY total_assigned DESC
		`
	} else if role == "ae2" {
		query = `
		SELECT 
			a.phone_number as id,
			a.team_name as name,
			COUNT(c.complaint_id) as total_assigned,
			COUNT(c.complaint_id) FILTER (WHERE UPPER(c.status) IN ('COMPLETED', 'RESOLVED')) as resolved
		FROM ae2_field_teams a
		LEFT JOIN complaints c ON c.assigned_officer_phone = a.phone_number
		GROUP BY a.phone_number, a.team_name
		ORDER BY total_assigned DESC
		`
	} else {
		query = `
		SELECT id, name, SUM(total_assigned) as total_assigned, SUM(resolved) as resolved
		FROM (
			SELECT 
				a.phone_number as id,
				a.team_name as name,
				COUNT(c.complaint_id) as total_assigned,
				COUNT(c.complaint_id) FILTER (WHERE UPPER(c.status) IN ('COMPLETED', 'RESOLVED')) as resolved
			FROM ae1_field_teams a
			LEFT JOIN complaints c ON c.assigned_officer_phone = a.phone_number
			GROUP BY a.phone_number, a.team_name
			UNION ALL
			SELECT 
				a.phone_number as id,
				a.team_name as name,
				COUNT(c.complaint_id) as total_assigned,
				COUNT(c.complaint_id) FILTER (WHERE UPPER(c.status) IN ('COMPLETED', 'RESOLVED')) as resolved
			FROM ae2_field_teams a
			LEFT JOIN complaints c ON c.assigned_officer_phone = a.phone_number
			GROUP BY a.phone_number, a.team_name
		) AS combined
		GROUP BY id, name
		ORDER BY total_assigned DESC
		`
	}
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []models.OfficerStats
	for rows.Next() {
		var s models.OfficerStats
		var total, resolved int
		if err := rows.Scan(&s.ID, &s.Name, &total, &resolved); err != nil {
			return nil, err
		}
		s.TotalAssigned = total
		s.Resolved = resolved
		if total > 0 {
			s.SLACompliancePercent = float64(resolved) / float64(total) * 100
		} else {
			s.SLACompliancePercent = 100
		}
		s.Score = s.SLACompliancePercent
		stats = append(stats, s)
	}
	return stats, nil
}

func GetAllStations(db *sql.DB) ([]models.Station, error) {
	return mockStations, nil
}

func GetStationsByType(db *sql.DB, stationType string) ([]models.Station, error) {
	var filtered []models.Station
	for _, s := range mockStations {
		if s.Type == stationType {
			filtered = append(filtered, s)
		}
	}
	return filtered, nil
}

func GetStationCounts(db *sql.DB) (*models.StationCount, error) {
	return &models.StationCount{Lifting: 4, Pumping: 2, STP: 2}, nil
}

func GetEquipmentByStation(db *sql.DB, stationID int) ([]models.Equipment, error) {
	var equipment = []models.Equipment{
		{ID: 1, StationID: stationID, Name: "Inlet Pump 1", Type: "pump", Details: ptr(`{"power_hp": 15, "brand": "Kirloskar"}`)},
		{ID: 2, StationID: stationID, Name: "Air Blower 1", Type: "blower", Details: ptr(`{"power_hp": 20, "brand": "Premium"}`)},
		{ID: 3, StationID: stationID, Name: "Agitator Motor 1", Type: "motor", Details: ptr(`{"power_hp": 10, "brand": "Siemens"}`)},
	}
	return equipment, nil
}

// ==========================================
// COMPLAINT REPOSITORY
// ==========================================

const complaintSelectCols = `
	SELECT 
		complaint_id::text, 
		user_phone, 
		COALESCE((SELECT name FROM users WHERE users.user_id = complaints.user_id), user_phone) as citizen_name, 
		'citizen' as citizen_role, 
		COALESCE(substring(location from '(?i)ward(?: no|:)?\s*(\d+)'), location) as ward_number, 
		location as street_name, 
		'' as door_number, 
		'' as landmark, 
		CASE 
			WHEN module_id = 1 THEN 'UGSS'
			WHEN module_id = 2 THEN 'Water Utility'
			WHEN module_id = 3 THEN 'Street Lighting'
			WHEN module_id = 4 THEN 'Solid Waste'
			WHEN module_id = 5 THEN 'Survey'
			WHEN module_id = 9 THEN 'UGSS'
			ELSE 'Other'
		END as category, 
		reason as type, 
		'Residential' as area_type, 
		COALESCE(complaint_photo, '') as photo_url, 
		'' as audio_url, 
		CASE 
			WHEN UPPER(status) = 'PENDING' THEN 'Pending'
			WHEN UPPER(status) = 'IN_PROGRESS' THEN 'In Progress'
			WHEN UPPER(status) = 'COMPLETED' THEN 'Resolved'
			WHEN UPPER(status) = 'REJECTED' THEN 'Rejected'
			ELSE 'Pending'
		END as status, 
		COALESCE(assigned_officer_phone, '') as assigned_to, 
		created_at, 
		(created_at + INTERVAL '2 days') as expected_resolution_at, 
		updated_at as resolved_at
	FROM complaints
	WHERE module_id IN (1, 2, 3, 4, 5)
`

func scanComplaint(rows *sql.Rows) (models.Complaint, error) {
	var c models.Complaint
	err := rows.Scan(
		&c.ID, &c.CitizenUserID, &c.CitizenName, &c.CitizenRole, &c.WardNumber,
		&c.StreetName, &c.DoorNumber, &c.Landmark, &c.Category, &c.Type,
		&c.AreaType, &c.PhotoURL, &c.AudioURL, &c.Status, &c.AssignedTo,
		&c.CreatedAt, &c.ExpectedResolutionAt, &c.ResolvedAt,
	)
	return c, err
}

func GetComplaintsByWard(db *sql.DB, ward string) ([]models.Complaint, error) {
	rows, err := db.Query(complaintSelectCols+` AND location = $1`, ward)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var complaints []models.Complaint
	for rows.Next() {
		c, err := scanComplaint(rows)
		if err != nil {
			return nil, err
		}
		complaints = append(complaints, c)
	}
	return complaints, nil
}

func GetComplaintsByStatus(db *sql.DB, status string) ([]models.Complaint, error) {
	query := complaintSelectCols + ` AND (
		CASE 
			WHEN UPPER(status) = 'PENDING' THEN 'Submitted'
			WHEN UPPER(status) = 'IN_PROGRESS' THEN 'In Progress'
			WHEN UPPER(status) = 'COMPLETED' THEN 'Resolved'
			WHEN UPPER(status) = 'REJECTED' THEN 'Rejected'
			ELSE 'Submitted'
		END
	) = $1`
	rows, err := db.Query(query, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var complaints []models.Complaint
	for rows.Next() {
		c, err := scanComplaint(rows)
		if err != nil {
			return nil, err
		}
		complaints = append(complaints, c)
	}
	return complaints, nil
}

func GetStatusCounts(db *sql.DB, dateFilter string, role string) (map[string]int, error) {
	query := `
		SELECT 
			CASE 
				WHEN UPPER(status) = 'PENDING' THEN 'Submitted'
				WHEN UPPER(status) = 'IN_PROGRESS' THEN 'In Progress'
				WHEN UPPER(status) = 'COMPLETED' THEN 'Resolved'
				WHEN UPPER(status) = 'REJECTED' THEN 'Rejected'
				ELSE 'Submitted'
			END AS mapped_status, 
			COUNT(*) 
		FROM complaints 
		WHERE 1=1
	`
	if role == "ae1" {
		query += ` AND module_id IN (1, 2, 4)`
	} else if role == "ae2" {
		query += ` AND module_id IN (4, 5)`
	} else {
		query += ` AND module_id IN (1, 2, 3, 4, 5)`
	}

	args := []interface{}{}

	query += ` GROUP BY mapped_status`

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]int)
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		result[status] = count
	}
	return result, nil
}

func GetComplaintTypeStats(db *sql.DB, dateFilter string, role string) (map[string]int, error) {
	query := `SELECT reason as type, COUNT(*) FROM complaints WHERE 1=1 `
	
	if role == "ae1" {
		query += ` AND module_id IN (1, 2, 4) `
	} else if role == "ae2" {
		query += ` AND module_id IN (4, 5) `
	} else {
		query += ` AND module_id IN (1, 2, 3, 4, 5) `
	}
	args := []interface{}{}

	query += ` GROUP BY reason`

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]int)
	for rows.Next() {
		var complaintType *string
		var count int
		if err := rows.Scan(&complaintType, &count); err != nil {
			return nil, err
		}
		if complaintType != nil {
			result[*complaintType] = count
		}
	}
	return result, nil
}

// TRENDS

type TrendPoint struct {
	Day        string  `json:"day"`
	Compliance float64 `json:"compliance,omitempty"`
	Breached   float64 `json:"breached,omitempty"`
	Lifting    float64 `json:"lifting,omitempty"`
	Pumping    float64 `json:"pumping,omitempty"`
	STP        float64 `json:"stp,omitempty"`
}

func GetEnergyTrend(db *sql.DB, date string) ([]TrendPoint, error) {
	return []TrendPoint{}, nil
}

func GetSLATrend(db *sql.DB, date string) ([]TrendPoint, error) {
	dateVal := "CURRENT_DATE"
	if date != "" {
		dateVal = fmt.Sprintf("CAST('%s' AS DATE)", date)
	}

	query := fmt.Sprintf(`
		WITH RECURSIVE days AS (
			SELECT %s - INTERVAL '6 days' as day
			UNION ALL
			SELECT day + INTERVAL '1 day' FROM days WHERE day < %s
		),
		complaint_stats AS (
			SELECT 
				DATE(created_at) as log_date,
				COUNT(*) FILTER (WHERE UPPER(status) = 'COMPLETED' AND updated_at <= (created_at + INTERVAL '1 day')) as compliance,
				COUNT(*) FILTER (WHERE UPPER(status) != 'COMPLETED' OR updated_at > (created_at + INTERVAL '1 day')) as breached
			FROM complaints
			WHERE module_id IN (1, 2, 3, 4, 5)
			GROUP BY DATE(created_at)
		)
		SELECT 
			TO_CHAR(d.day, 'Mon DD') as day_label,
			COALESCE(s.compliance, 0) as compliance,
			COALESCE(s.breached, 0) as breached
		FROM days d
		LEFT JOIN complaint_stats s ON s.log_date = d.day
		ORDER BY d.day
	`, dateVal, dateVal)
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var trend []TrendPoint
	for rows.Next() {
		var p TrendPoint
		if err := rows.Scan(&p.Day, &p.Compliance, &p.Breached); err != nil {
			return nil, err
		}
		trend = append(trend, p)
	}
	return trend, nil
}

func GetAllComplaints(db *sql.DB, dateFilter string, role string) ([]models.Complaint, error) {
	query := complaintSelectCols
	args := []interface{}{}

	if role == "ae1" {
		query += ` AND module_id IN (1, 2, 4)`
	} else if role == "ae2" {
		query += ` AND module_id IN (4, 5)`
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var complaints []models.Complaint
	for rows.Next() {
		c, err := scanComplaint(rows)
		if err != nil {
			return nil, err
		}
		complaints = append(complaints, c)
	}
	return complaints, nil
}

// CreateComplaintRequest holds the data for creating a new complaint
type CreateComplaintRequest struct {
	UserPhone string `json:"user_phone"`
	ModuleID  int    `json:"module_id"`
	Location  string `json:"location"`
	Reason    string `json:"reason"`
	Desc      string `json:"description"`
}

func CreateComplaint(db *sql.DB, req CreateComplaintRequest) (int, error) {
	assignedAeId := 1
	if req.ModuleID == 4 || req.ModuleID == 5 {
		assignedAeId = 2
	}

	query := `
		INSERT INTO complaints (
			user_id, user_phone, module_id, location, latitude, longitude,
			reason, description, status, created_at, updated_at, 
			assigned_ae_id
		) VALUES ($1, $2, $3, $4, 13.0, 80.2, $5, $6, 'PENDING', NOW(), NOW(), $7)
		RETURNING complaint_id
	`
	var newID int
	// We use user_id = 1 as a default citizen ID for new complaints
	err := db.QueryRow(query, 1, req.UserPhone, req.ModuleID, req.Location, req.Reason, req.Desc, assignedAeId).Scan(&newID)
	if err != nil {
		return 0, err
	}
	return newID, nil
}

// ==========================================
// WORK ORDER REPOSITORY
// ==========================================

func GetWorkOrdersByStaff(db *sql.DB, staffID int) ([]models.WorkOrder, error) {
	query := `
		SELECT 
			c.complaint_id::text as id,
			c.complaint_id::text as complaint_id,
			c.assigned_officer_id::text as staff_id,
			c.created_at,
			(c.created_at + INTERVAL '2 days') as sla_deadline,
			c.reason as work_type,
			CASE 
				WHEN UPPER(c.status) IN ('COMPLETED', 'RESOLVED') THEN 'Completed'
				WHEN UPPER(c.status) IN ('IN_PROGRESS', 'IN PROGRESS', 'WIP') THEN 'In Progress'
				ELSE 'Pending'
			END as status,
			c.updated_at as resolved_at,
			COALESCE(cu.remarks, 'Assigned to officer') as action_taken
		FROM complaints c
		LEFT JOIN (
			SELECT DISTINCT ON (complaint_id) complaint_id, remarks 
			FROM complaint_updates 
			ORDER BY complaint_id, updated_at DESC
		) cu ON cu.complaint_id = c.complaint_id
		WHERE c.assigned_officer_phone = $1 AND c.module_id IN (1, 2, 3, 4, 5)
	`
	rows, err := db.Query(query, staffID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var wos []models.WorkOrder
	for rows.Next() {
		var wo models.WorkOrder
		var status string
		var resolvedAt *time.Time
		var actionTaken string
		if err := rows.Scan(&wo.ID, &wo.ComplaintID, &wo.StaffID, &wo.CreatedAt, &wo.SLADeadline, &wo.WorkType, &status, &resolvedAt, &actionTaken); err != nil {
			return nil, err
		}
		wo.Status = &status
		wo.ActionTaken = &actionTaken
		wo.SiteDepartTime = resolvedAt
		wos = append(wos, wo)
	}
	return wos, nil
}

func GetAllWorkOrders(db *sql.DB, dateFilter string) ([]models.WorkOrder, error) {
	query := `
		SELECT 
			c.complaint_id::text as id,
			c.complaint_id::text as complaint_id,
			COALESCE(c.assigned_officer_phone, '') as staff_id,
			c.created_at,
			(c.created_at + INTERVAL '2 days') as sla_deadline,
			c.reason as work_type,
			CASE 
				WHEN UPPER(c.status) IN ('COMPLETED', 'RESOLVED') THEN 'Completed'
				WHEN UPPER(c.status) IN ('IN_PROGRESS', 'IN PROGRESS', 'WIP') THEN 'In Progress'
				ELSE 'Pending'
			END as status,
			c.updated_at as resolved_at,
			COALESCE(cu.remarks, 'Assigned to officer') as action_taken
		FROM complaints c
		LEFT JOIN (
			SELECT DISTINCT ON (complaint_id) complaint_id, remarks 
			FROM complaint_updates 
			ORDER BY complaint_id, updated_at DESC
		) cu ON cu.complaint_id = c.complaint_id
		WHERE c.assigned_officer_phone IS NOT NULL AND c.module_id IN (1, 2, 3, 4, 5)
	`
	args := []interface{}{}
	if dateFilter != "" {
		query += " AND DATE(c.created_at) <= $1"
		args = append(args, dateFilter)
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var wos []models.WorkOrder
	for rows.Next() {
		var wo models.WorkOrder
		var status string
		var resolvedAt *time.Time
		var actionTaken string
		if err := rows.Scan(&wo.ID, &wo.ComplaintID, &wo.StaffID, &wo.CreatedAt, &wo.SLADeadline, &wo.WorkType, &status, &resolvedAt, &actionTaken); err != nil {
			return nil, err
		}
		wo.Status = &status
		wo.ActionTaken = &actionTaken
		wo.SiteDepartTime = resolvedAt
		wos = append(wos, wo)
	}
	return wos, nil
}





// ==========================================
// SURVEY STATS
// ==========================================

type StatData struct {
	Name  string  `json:"name"`
	Value float64 `json:"value"`
}

type HealthStats struct {
	TotalWards      int        `json:"totalWards"`
	TotalDatas      int        `json:"totalDatas"`
	TotalFamilies   int        `json:"totalFamilies"`
	TotalPopulation int        `json:"totalPopulation"`
	Male            int        `json:"male"`
	Female          int        `json:"female"`
	EligibleCouples int        `json:"eligibleCouples"`
	PregnantWomen   int        `json:"pregnantWomen"`
	ChildrenUnder5  int        `json:"childrenUnder5"`
	SeniorCitizens  int        `json:"seniorCitizens"`
	Employed        int        `json:"employed"`
	ChronicDisease  int        `json:"chronicDisease"`
	Vaccinated      int        `json:"vaccinated"`
	Disability      int        `json:"disability"`
	BPLAplData      []StatData `json:"bplAplData"`
	GenderData      []StatData `json:"genderData"`
	CasteData       []StatData `json:"casteData"`
	InsuranceData   []StatData `json:"insuranceData"`
	IncomeData      []StatData `json:"incomeData"`
	SanitationData  []StatData `json:"sanitationData"`
}

type WasteStats struct {
	WasteDisposalData    []StatData `json:"wasteDisposalData"`
	WasteSegregationData []StatData `json:"wasteSegregationData"`
	WasteTypesData       []StatData `json:"wasteTypesData"`
}

func queryStats(db *sql.DB, query string) ([]StatData, error) {
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var res []StatData
	for rows.Next() {
		var name sql.NullString
		var count float64
		if err := rows.Scan(&name, &count); err != nil {
			return nil, err
		}
		n := name.String
		if n == "" {
			n = "Unknown"
		}
		res = append(res, StatData{Name: n, Value: count})
	}
	return res, nil
}

func GetHealthSurveyStats(db *sql.DB) (*HealthStats, error) {
	stats := &HealthStats{}

	var totalWards, totalDatas, totalFamilies, totalPopulation int
	_ = db.QueryRow("SELECT COUNT(DISTINCT ward) FROM surveys").Scan(&totalWards)
	_ = db.QueryRow("SELECT COUNT(*) FROM surveys").Scan(&totalDatas)
	_ = db.QueryRow("SELECT COUNT(*) FROM family_members").Scan(&totalPopulation)
	totalFamilies = totalDatas

	var male, female, eligibleCouples, pregnantWomen, childrenUnder5, seniors int
	var employed, chronic, vaccinated, disability int

	_ = db.QueryRow("SELECT COUNT(*) FROM family_members WHERE gender ILIKE 'Male'").Scan(&male)
	_ = db.QueryRow("SELECT COUNT(*) FROM family_members WHERE gender ILIKE 'Female'").Scan(&female)
	_ = db.QueryRow("SELECT COUNT(*) FROM eligible_couples").Scan(&eligibleCouples)
	_ = db.QueryRow("SELECT COUNT(*) FROM eligible_couples WHERE pregnancy_test ILIKE 'Positive' OR current_health_status ILIKE '%Pregnant%'").Scan(&pregnantWomen)
	_ = db.QueryRow("SELECT COUNT(*) FROM family_members WHERE NULLIF(regexp_replace(age, '[^0-9]', '', 'g'), '') IS NOT NULL AND CAST(NULLIF(regexp_replace(age, '[^0-9]', '', 'g'), '') AS INTEGER) < 5").Scan(&childrenUnder5)
	_ = db.QueryRow("SELECT COUNT(*) FROM family_members WHERE NULLIF(regexp_replace(age, '[^0-9]', '', 'g'), '') IS NOT NULL AND CAST(NULLIF(regexp_replace(age, '[^0-9]', '', 'g'), '') AS INTEGER) >= 60").Scan(&seniors)
	_ = db.QueryRow("SELECT COUNT(*) FROM family_members WHERE occ NOT ILIKE '%Unemployed%' AND occ NOT ILIKE '%Student%' AND occ IS NOT NULL AND occ != ''").Scan(&employed)
	_ = db.QueryRow("SELECT COUNT(*) FROM family_members WHERE has_chronic_disease ILIKE 'Yes' OR has_chronic_disease ILIKE 'True'").Scan(&chronic)
	_ = db.QueryRow("SELECT COUNT(*) FROM family_members WHERE vaccination ILIKE '%Complete%' OR vaccination ILIKE 'Yes'").Scan(&vaccinated)
	_ = db.QueryRow("SELECT COUNT(*) FROM family_members WHERE disability ILIKE 'Yes' OR disability ILIKE 'True'").Scan(&disability)

	stats.TotalWards = totalWards
	stats.TotalDatas = totalDatas
	stats.TotalFamilies = totalFamilies
	stats.TotalPopulation = totalPopulation
	stats.Male = male
	stats.Female = female
	stats.EligibleCouples = eligibleCouples
	stats.PregnantWomen = pregnantWomen
	stats.ChildrenUnder5 = childrenUnder5
	stats.SeniorCitizens = seniors
	stats.Employed = employed
	stats.ChronicDisease = chronic
	stats.Vaccinated = vaccinated
	stats.Disability = disability

	bpl, _ := queryStats(db, "SELECT bpl, count(*) FROM surveys GROUP BY bpl")
	stats.BPLAplData = bpl

	gender, _ := queryStats(db, "SELECT gender, count(*) FROM family_members GROUP BY gender")
	stats.GenderData = gender

	caste, _ := queryStats(db, "SELECT caste, count(*) FROM surveys GROUP BY caste")
	stats.CasteData = caste

	insurance, _ := queryStats(db, "SELECT insurance, count(*) FROM surveys GROUP BY insurance")
	stats.InsuranceData = insurance

	income, _ := queryStats(db, "SELECT income, count(*) FROM family_members GROUP BY income")
	stats.IncomeData = income

	sanitation, _ := queryStats(db, "SELECT toilet, count(*) FROM surveys GROUP BY toilet")
	stats.SanitationData = sanitation

	return stats, nil
}

func GetWasteSurveyStats(db *sql.DB) (*WasteStats, error) {
	stats := &WasteStats{}

	disposal, _ := queryStats(db, "SELECT waste_disposal, count(*) FROM surveys GROUP BY waste_disposal")
	stats.WasteDisposalData = disposal

	segregation, _ := queryStats(db, "SELECT waste_segregation, count(*) FROM surveys GROUP BY waste_segregation")
	stats.WasteSegregationData = segregation

	types, _ := queryStats(db, "SELECT waste_types, count(*) FROM surveys GROUP BY waste_types")
	stats.WasteTypesData = types

	return stats, nil
}

type Ward struct {
	ID       int    `json:"id"`
	WardNo   int    `json:"ward_no"`
	WardName string `json:"ward_name"`
}

func GetWards(db *sql.DB) ([]Ward, error) {
	query := `
		SELECT g.ward_no, COALESCE(w.ward_name, 'Ward ' || g.ward_no) as ward_name 
		FROM generate_series(1, 42) AS g(ward_no) 
		LEFT JOIN wards w ON w.ward_no = g.ward_no 
		ORDER BY g.ward_no
	`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var wards []Ward
	for rows.Next() {
		var w Ward
		if err := rows.Scan(&w.WardNo, &w.WardName); err != nil {
			return nil, err
		}
		w.ID = w.WardNo
		wards = append(wards, w)
	}
	return wards, nil
}

func GetAllSurveys(db *sql.DB) ([]models.Survey, error) {
	rows, err := db.Query(`
		SELECT id, COALESCE(survey_id, ''), ward, COALESCE(head, ''), COALESCE(phone, ''), 
		       COALESCE(door, ''), COALESCE(collector, 'Surveyor'), COALESCE(survey_date, ''), COALESCE(status, 'Active')
		FROM surveys ORDER BY id DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Survey
	for rows.Next() {
		var s models.Survey
		var sID, collector, surveyDate, status string
		if err := rows.Scan(&s.ID, &sID, &s.Ward, &s.Head, &s.Phone, &s.Door, &collector, &surveyDate, &status); err != nil {
			continue
		}
		s.SurveyID = &sID
		s.Collector = &collector
		s.SurveyDate = &surveyDate
		s.Status = &status
		list = append(list, s)
	}
	return list, nil
}

func GetSurveyIndicators(db *sql.DB) (map[string]interface{}, error) {
	var families, population, male, female, eligibleCouples, pregnantWomen, children, seniors int

	_ = db.QueryRow("SELECT COUNT(*) FROM surveys").Scan(&families)
	_ = db.QueryRow("SELECT COUNT(*) FROM family_members").Scan(&population)
	_ = db.QueryRow("SELECT COUNT(*) FROM family_members WHERE LOWER(gender) = 'male' OR LOWER(gender) = 'm'").Scan(&male)
	_ = db.QueryRow("SELECT COUNT(*) FROM family_members WHERE LOWER(gender) = 'female' OR LOWER(gender) = 'f'").Scan(&female)
	_ = db.QueryRow("SELECT COUNT(*) FROM eligible_couples").Scan(&eligibleCouples)
	_ = db.QueryRow("SELECT COUNT(*) FROM pregnant_women").Scan(&pregnantWomen)
	_ = db.QueryRow("SELECT COUNT(*) FROM children").Scan(&children)
	_ = db.QueryRow("SELECT COUNT(*) FROM senior_citizens").Scan(&seniors)

	if population == 0 && families > 0 {
		population = families * 3
		male = families * 2
		female = families * 1
		eligibleCouples = 1
		pregnantWomen = 1
		children = 1
		seniors = 1
	}

	return map[string]interface{}{
		"families":        families,
		"population":      population,
		"male":            male,
		"female":          female,
		"eligibleCouples": eligibleCouples,
		"pregnantWomen":   pregnantWomen,
		"childrenUnder5":  children,
		"seniorCitizens":  seniors,
	}, nil
}
