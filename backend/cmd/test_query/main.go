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

	health, err := repository.GetHealthSurveyStats(db)
	if err != nil {
		fmt.Println("Health survey error:", err)
	} else {
		fmt.Printf("Health stats BPL/APL count: %d, Gender count: %d\n", len(health.BPLAplData), len(health.GenderData))
	}

	waste, err := repository.GetWasteSurveyStats(db)
	if err != nil {
		fmt.Println("Waste survey error:", err)
	} else {
		fmt.Printf("Waste stats Disposal count: %d, Segregation count: %d\n", len(waste.WasteDisposalData), len(waste.WasteSegregationData))
	}
}
