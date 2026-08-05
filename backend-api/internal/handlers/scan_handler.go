package handlers

import (
	"net/http"

	"github.com/cyberwatch/backend-api/internal/middleware"
	"github.com/cyberwatch/backend-api/internal/response"
	"github.com/cyberwatch/backend-api/internal/services"
	"github.com/gin-gonic/gin"
)

type ScanHandler struct {
	service *services.ScanService
}

func NewScanHandler(service *services.ScanService) *ScanHandler {
	return &ScanHandler{service: service}
}

type createScanRequest struct {
	CompanyID uint `json:"companyId" binding:"required"`
}

func (h *ScanHandler) Create(c *gin.Context) {
	var req createScanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	requestedBy := "unknown"
	if user, ok := middleware.UserFromContext(c); ok {
		if user.Email != "" {
			requestedBy = user.Email
		} else if user.Name != "" {
			requestedBy = user.Name
		} else if user.Subject != "" {
			requestedBy = user.Subject
		}
	}

	scan, err := h.service.Create(services.CreateScanCommand{
		CompanyID:   req.CompanyID,
		RequestedBy: requestedBy,
	})
	if err != nil {
		handleServiceError(c, err)
		return
	}

	// Async acceptance — worker completes later via HTTP or RabbitMQ.
	response.JSON(c, http.StatusAccepted, scan)
}

func (h *ScanHandler) List(c *gin.Context) {
	scans, err := h.service.List()
	if err != nil {
		response.Internal(c, "Internal error")
		return
	}
	response.JSON(c, http.StatusOK, scans)
}

func (h *ScanHandler) GetByID(c *gin.Context) {
	id, err := parseID(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	scan, err := h.service.GetByID(id)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, scan)
}
