// Package routes registers HTTP endpoints and middleware for the CyberWatch API.
package routes

import (
	"github.com/cyberwatch/backend-api/internal/auth"
	"github.com/cyberwatch/backend-api/internal/handlers"
	"github.com/cyberwatch/backend-api/internal/middleware"
	"github.com/gin-gonic/gin"
)

// Handlers groups HTTP adapters injected from main.
type Handlers struct {
	Companies *handlers.CompanyHandler
	Scans     *handlers.ScanHandler
	Dashboard *handlers.DashboardHandler
}

// AuthHooks lets main inject JWT middleware (or TestAuth in tests).
type AuthHooks struct {
	Authenticate gin.HandlerFunc
}

// Setup builds the Gin engine: public /health, JWT-protected /api/*, role gates on writes.
func Setup(corsOrigin string, h Handlers, authHooks AuthHooks) *gin.Engine {
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.RequestLogger())
	router.Use(middleware.CORS(corsOrigin))

	router.GET("/health", handlers.Health)

	api := router.Group("/api")
	// Every /api call needs a valid Keycloak JWT; mutating routes add RequireRoles below.
	api.Use(authHooks.Authenticate)
	{
		api.GET("/dashboard", h.Dashboard.Get)

		api.GET("/companies", h.Companies.List)
		api.GET("/companies/:id", h.Companies.GetByID)
		api.POST("/companies", middleware.RequireRoles(auth.RoleAdmin), h.Companies.Create)
		api.PUT("/companies/:id", middleware.RequireRoles(auth.RoleAdmin), h.Companies.Update)
		api.DELETE("/companies/:id", middleware.RequireRoles(auth.RoleAdmin), h.Companies.Delete)

		api.GET("/scans", h.Scans.List)
		api.GET("/scans/:id", h.Scans.GetByID)
		api.POST("/scans", middleware.RequireRoles(auth.RoleAdmin, auth.RoleAnalyst), h.Scans.Create)
	}

	return router
}
