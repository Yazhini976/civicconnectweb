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
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	fmt.Println("Connected to DB.")

	query := `
	CREATE TABLE IF NOT EXISTS feedback (
		id SERIAL PRIMARY KEY,
		complaint_id INTEGER,
		rating VARCHAR(50),
		comment TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = db.Exec(query)
	if err != nil {
		log.Fatalf("Failed to create feedback table: %v", err)
	}

	fmt.Println("Successfully created feedback table.")
}
