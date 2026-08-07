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

	rand.Seed(time.Now().UnixNano())

	// Clear old feedback (by setting feedback_rating to NULL on complaints)
	_, err = db.Exec("UPDATE complaints SET feedback_rating = NULL, feedback_comments = NULL, feedback_submitted_at = NULL;")
	if err != nil {
		log.Fatalf("Failed to clear feedback: %v", err)
	}

	// Fetch complaints to add feedback for
	rows, err := db.Query("SELECT complaint_id FROM complaints WHERE status IN ('COMPLETED', 'REJECTED', 'OFFICER_COMPLETED')")
	if err != nil {
		log.Fatalf("Failed to fetch complaints: %v", err)
	}
	defer rows.Close()

	ratings := []string{"Good", "Good", "Good", "Average", "Average", "Bad"}
	count := 0

	for rows.Next() {
		var complaintId string
		if err := rows.Scan(&complaintId); err != nil {
			log.Println("Error scanning row:", err)
			continue
		}

		// Randomly decide if they left feedback (80% chance)
		if rand.Float32() < 0.8 {
			rating := ratings[rand.Intn(len(ratings))]
			_, err = db.Exec("UPDATE complaints SET feedback_rating = $1, feedback_comments = 'Dummy feedback', feedback_submitted_at = NOW() WHERE complaint_id = $2", rating, complaintId)
			if err != nil {
				log.Println("Error inserting feedback:", err)
			} else {
				count++
			}
		}
	}

	fmt.Printf("Successfully inserted %d dummy feedback records.\n", count)
}
