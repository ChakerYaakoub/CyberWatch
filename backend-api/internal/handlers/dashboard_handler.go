package handlers

import (
	"net/http"

	"github.com/cyberwatch/backend-api/internal/response"
	"github.com/cyberwatch/backend-api/internal/services"
	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	service *services.DashboardService
}

func NewDashboardHandler(service *services.DashboardService) *DashboardHandler {
	return &DashboardHandler{service: service}
}

func (h *DashboardHandler) Get(c *gin.Context) {
	stats, err := h.service.GetStats()
	if err != nil {
		response.Internal(c, "Internal error")
		return
	}
	response.JSON(c, http.StatusOK, stats)
}
