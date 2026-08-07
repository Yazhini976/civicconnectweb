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

	// Update the complaints that we just set to NOW() to instead be '2026-08-02'
	// so that they match the user's selected date in the UI calendar.
	query := `
		UPDATE complaints 
		SET created_at = '2026-08-02 10:00:00'
		WHERE DATE(created_at) = CURRENT_DATE
	`
	res, err := db.Exec(query)
	if err != nil {
		log.Fatalf("Failed to update complaints: %v", err)
	}
	
	count, _ := res.RowsAffected()
	fmt.Printf("Updated %d complaints to be '2026-08-02'!\n", count)
}
