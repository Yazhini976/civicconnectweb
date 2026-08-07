package main

import (
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"time"

	_ "github.com/lib/pq"
)

func main() {
	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	fmt.Println("Connected to DB.")

	rand.Seed(time.Now().UnixNano())

	modules := []struct {
		id      int
		reasons []string
	}{
		{id: 1, reasons: []string{"Manhole Missing", "Clogged Drain", "Sewer Overflow", "Pipe Blockage", "Foul Smell", "Others"}},
		{id: 2, reasons: []string{"Pipe Leakage", "No Water Supply", "Contaminated Water", "Others"}},
		{id: 3, reasons: []string{"Street Light Not Working", "Light Flickering", "Damaged Pole", "Light On During Day", "Others"}},
		{id: 4, reasons: []string{"No Collection", "Mixed Collection", "Drainage Block", "Road Sweep", "Garbage Vulnerable Point (GVP)", "Improper Hazardous Waste Disposal", "Worker Issue", "Others"}},
		{id: 5, reasons: []string{"Health", "Solidwaste survey"}},
	}

	statuses := []string{"PENDING", "ACCEPTED", "IN_PROGRESS", "OFFICER_COMPLETED", "OFFICER_REJECTED", "COMPLETED", "REJECTED"}
	locations := []string{
		"Ward 15, Tenkasi Road, Rajapalayam",
		"Ward 20, Sammandapuram, Rajapalayam",
		"Ward 32, Pudupalayam, Rajapalayam",
		"Ward 10, Avarampatti, Rajapalayam",
		"Ward 8, Mudangiar Road, Rajapalayam",
		"Ward 42, TP Mills Road, Rajapalayam",
		"Ward 25, Cotton Market, Rajapalayam",
		"Ward 5, Sanjeevi Nathapuram, Rajapalayam",
		"Ward 18, PACR Road, Rajapalayam",
		"Ward 30, BPK Street, Rajapalayam",
	}
	officerPhones := []string{"9876543210", "9876543211", "9876543212", "9998887776", "9998887777"}
	
	// Create some officers in ae1_field_teams if they don't exist
	for i, phone := range officerPhones {
		db.Exec("INSERT INTO ae1_field_teams (officer_id, officer_name, phone_number, module_id, created_at, updated_at) VALUES ($1, $2, $3, 1, NOW(), NOW()) ON CONFLICT DO NOTHING", i+100, fmt.Sprintf("Officer %d", i+1), phone)
		db.Exec("INSERT INTO ae2_officers (officer_id, officer_name, phone_number, module_id, created_at, updated_at) VALUES ($1, $2, $3, 4, NOW(), NOW()) ON CONFLICT DO NOTHING", i+200, fmt.Sprintf("Surveyor %d", i+1), phone)
	}

	users := []struct {
		id    int
		phone string
	}{
		{id: 1, phone: "1234567890"},
		{id: 2, phone: "8300832260"},
		{id: 3, phone: "7810098412"},
	}

	fmt.Println("Seeding 5000 dummy complaints from June 1 to Aug 4...")

	// Clear old complaints
	db.Exec("TRUNCATE TABLE complaints RESTART IDENTITY CASCADE;")

	startDate := time.Date(2026, 6, 1, 0, 0, 0, 0, time.Local)
	endDate := time.Date(2026, 8, 4, 23, 59, 59, 0, time.Local)
	duration := endDate.Sub(startDate)

	for i := 0; i < 5000; i++ {
		module := modules[rand.Intn(len(modules))]
		reason := module.reasons[rand.Intn(len(module.reasons))]
		status := statuses[rand.Intn(len(statuses))]
		location := locations[rand.Intn(len(locations))]
		
		lat := 13.0 + rand.Float64()*0.1
		lng := 80.2 + rand.Float64()*0.1
		
		// Random time between Jun 1 and Aug 4
		randomDuration := time.Duration(rand.Int63n(int64(duration)))
		createdAt := startDate.Add(randomDuration)
		
		assignedOfficer := ""
		if status != "PENDING" && status != "REJECTED" {
			assignedOfficer = officerPhones[rand.Intn(len(officerPhones))]
		}

		rejectionReason := ""
		if status == "REJECTED" {
			rejectionReason = "Not a valid complaint or duplicate."
		}
		
		officerRejectionReason := ""
		if status == "OFFICER_REJECTED" {
			officerRejectionReason = "Unable to locate the issue on the ground."
		}
		
		photo := "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400"
		assignedAeId := 1
		if module.id == 4 || module.id == 5 {
			assignedAeId = 2
		}
		
		query := `
			INSERT INTO complaints (
				user_id, user_phone, module_id, location, latitude, longitude,
				reason, description, status, created_at, updated_at, assigned_officer_phone,
				assigned_ae_id, complaint_photo, rejection_reason, officer_rejection_reason
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $11, $12, $13, $14, $15)
		`
		
		user := users[rand.Intn(len(users))]
		
		_, err := db.Exec(query, 
			user.id, user.phone, module.id, location, lat, lng,
			reason, "Generated dummy description for testing.", status, createdAt,
			sql.NullString{String: assignedOfficer, Valid: assignedOfficer != ""},
			assignedAeId, photo, 
			sql.NullString{String: rejectionReason, Valid: rejectionReason != ""},
			sql.NullString{String: officerRejectionReason, Valid: officerRejectionReason != ""},
		)
		
		if err != nil {
			log.Printf("Failed to insert row: %v", err)
		}
	}
	
	fmt.Println("Successfully seeded database!")
}
