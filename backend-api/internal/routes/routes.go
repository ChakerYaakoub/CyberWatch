package routes

import (
	"github.com/cyberwatch/backend-api/internal/handlers"
	"github.com/cyberwatch/backend-api/internal/middleware"
	"github.com/gin-gonic/gin"
)

type Handlers struct {
	Companies *handlers.CompanyHandler
	Scans     *handlers.ScanHandler
	Dashboard *handlers.DashboardHandler
}

func Setup(corsOrigin string, h Handlers) *gin.Engine {
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.RequestLogger())
	router.Use(middleware.CORS(corsOrigin))

	router.GET("/health", handlers.Health)

	api := router.Group("/api")
	{
		api.GET("/dashboard", h.Dashboard.Get)

		api.GET("/companies", h.Companies.List)
		api.POST("/companies", h.Companies.Create)
		api.GET("/companies/:id", h.Companies.GetByID)
		api.PUT("/companies/:id", h.Companies.Update)
		api.DELETE("/companies/:id", h.Companies.Delete)

		api.GET("/scans", h.Scans.List)
		api.POST("/scans", h.Scans.Create)
		api.GET("/scans/:id", h.Scans.GetByID)
	}

	return router
}
