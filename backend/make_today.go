package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

func main() {
	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer db.Close()

	// Update 50 complaints assigned to the officers to have created_at = NOW() (Today)
	// So that they show up in "Today's Complaints"
	query := `
		UPDATE complaints 
		SET created_at = NOW() 
		WHERE complaint_id IN (
			SELECT complaint_id FROM complaints 
			WHERE assigned_officer_phone IN (
				SELECT phone_number FROM ae1_field_teams WHERE team_name ILIKE '%officer%'
				UNION
				SELECT phone_number FROM ae2_officers WHERE team_name ILIKE '%officer%'
			)
			LIMIT 50
		)
	`
	res, err := db.Exec(query)
	if err != nil {
		log.Fatalf("Failed to update complaints: %v", err)
	}
	
	count, _ := res.RowsAffected()
	fmt.Printf("Updated %d complaints to be 'Today's complaints for the officers!\n", count)
	
	// Also update some other random complaints to be today so there is general data for today
	query2 := `
		UPDATE complaints 
		SET created_at = NOW() 
		WHERE complaint_id IN (
			SELECT complaint_id FROM complaints 
			WHERE assigned_officer_phone NOT IN (
				SELECT phone_number FROM ae1_field_teams WHERE team_name ILIKE '%officer%'
				UNION
				SELECT phone_number FROM ae2_officers WHERE team_name ILIKE '%officer%'
			)
			LIMIT 150
		)
	`
	res2, err := db.Exec(query2)
	if err != nil {
		log.Println("Failed to update random complaints:", err)
	} else {
		count2, _ := res2.RowsAffected()
		fmt.Printf("Updated %d other complaints to be 'Today's complaints!\n", count2)
	}
}
