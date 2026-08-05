package main

import (
	"fmt"
	"log"

	"github.com/cyberwatch/backend-api/internal/config"
	"github.com/cyberwatch/backend-api/internal/database"
	"github.com/cyberwatch/backend-api/internal/handlers"
	"github.com/cyberwatch/backend-api/internal/middleware"
	"github.com/cyberwatch/backend-api/internal/repositories"
	"github.com/cyberwatch/backend-api/internal/routes"
	"github.com/cyberwatch/backend-api/internal/services"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	db, err := database.Connect(cfg.DSN(), cfg.AppEnv != "production")
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}

	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("database migration failed: %v", err)
	}

	jwtAuth, err := middleware.NewJWTAuth(middleware.JWTConfig{
		KeycloakURL: cfg.KeycloakURL,
		Realm:       cfg.KeycloakRealm,
		Audience:    cfg.KeycloakClientID,
	})
	if err != nil {
		log.Fatalf("keycloak jwt setup failed: %v", err)
	}

	companyRepo := repositories.NewCompanyRepository(db)
	scanRepo := repositories.NewScanRepository(db)
	vulnRepo := repositories.NewVulnerabilityRepository(db)

	companyService := services.NewCompanyService(companyRepo)
	scanService := services.NewScanService(scanRepo, companyRepo)
	dashboardService := services.NewDashboardService(companyRepo, scanRepo, vulnRepo)

	router := routes.Setup(cfg.CORSOrigin, routes.Handlers{
		Companies: handlers.NewCompanyHandler(companyService),
		Scans:     handlers.NewScanHandler(scanService),
		Dashboard: handlers.NewDashboardHandler(dashboardService),
	}, routes.AuthHooks{
		Authenticate: jwtAuth,
	})

	addr := fmt.Sprintf(":%s", cfg.AppPort)
	log.Printf("CyberWatch API listening on port %s (env=%s, db=%s@%s:%s/%s, keycloak=%s/realms/%s)",
		cfg.AppPort,
		cfg.AppEnv,
		cfg.DBUser,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
		cfg.KeycloakURL,
		cfg.KeycloakRealm,
	)
	if err := router.Run(addr); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}
