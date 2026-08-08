package main

import (
	"database/sql"
	"fmt"
	"log"
	
	"civicconnectweb/backend/internal/repository"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	db, err := sql.Open("pgx", "postgres://postgres:972006@localhost:5432/civicconnect?sslmode=disable")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	complaints, err := repository.GetAllComplaints(db, "2026-08-05", "ae1")
	if err != nil {
		log.Fatal("ERROR in GetAllComplaints: ", err)
	}
	fmt.Printf("Success! Got %d complaints.\n", len(complaints))
}
