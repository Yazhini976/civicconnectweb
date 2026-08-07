package main

import (
	"database/sql"
	"fmt"
	"log"
	"math/rand"

	_ "github.com/lib/pq"
)

func main() {
	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer db.Close()

	rand.Seed(42)

	// Find officers named officer1, officer2, officer3
	officerPhones := []string{}
	rows, err := db.Query("SELECT team_name, phone_number FROM ae1_field_teams WHERE team_name ILIKE '%officer%'")
	if err == nil {
		for rows.Next() {
			var name, phone string
			rows.Scan(&name, &phone)
			officerPhones = append(officerPhones, phone)
			fmt.Printf("Found AE1 officer: %s (%s)\n", name, phone)
		}
		rows.Close()
	}

	rows2, err := db.Query("SELECT team_name, phone_number FROM ae2_officers WHERE team_name ILIKE '%officer%'")
	if err == nil {
		for rows2.Next() {
			var name, phone string
			rows2.Scan(&name, &phone)
			officerPhones = append(officerPhones, phone)
			fmt.Printf("Found AE2 officer: %s (%s)\n", name, phone)
		}
		rows2.Close()
	}

	if len(officerPhones) == 0 {
		fmt.Println("No officers found matching 'officer'")
		return
	}

	// Fetch 200 random complaints that are PENDING and assign them
	rows3, err := db.Query("SELECT complaint_id FROM complaints WHERE status = 'PENDING' LIMIT 150")
	if err != nil {
		log.Fatal(err)
	}
	defer rows3.Close()

	count := 0
	for rows3.Next() {
		var cid string
		if err := rows3.Scan(&cid); err != nil {
			continue
		}
		// Pick random officer
		phone := officerPhones[rand.Intn(len(officerPhones))]
		_, err = db.Exec("UPDATE complaints SET assigned_officer_phone = $1, status = 'IN_PROGRESS' WHERE complaint_id = $2", phone, cid)
		if err == nil {
			count++
		}
	}
	
	// Also mark some as COMPLETED
	rows4, err := db.Query("SELECT complaint_id FROM complaints WHERE status = 'PENDING' LIMIT 150")
	if err == nil {
		defer rows4.Close()
		for rows4.Next() {
			var cid string
			rows4.Scan(&cid)
			phone := officerPhones[rand.Intn(len(officerPhones))]
			db.Exec("UPDATE complaints SET assigned_officer_phone = $1, status = 'COMPLETED' WHERE complaint_id = $2", phone, cid)
			count++
		}
	}

	fmt.Printf("Successfully assigned %d complaints to the officers!\n", count)
}
