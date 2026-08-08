package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	
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
	
	j, _ := json.MarshalIndent(complaints, "", "  ")
	os.WriteFile(`c:\Users\ASUS\OneDrive\Pictures\Desktop\civicapp\dump_complaints.json`, j, 0644)
	fmt.Println("Dumped to dump_complaints.json")
}
