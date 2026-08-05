// Package handlers adapts HTTP (Gin) to services. Keep thin: bind → call service → map errors.
package handlers

import (
	"net/http"

	"github.com/cyberwatch/backend-api/internal/middleware"
	"github.com/cyberwatch/backend-api/internal/response"
	"github.com/cyberwatch/backend-api/internal/services"
	"github.com/gin-gonic/gin"
)

// ScanHandler exposes scan list/get/create over /api/scans.
type ScanHandler struct {
	service *services.ScanService
}

func NewScanHandler(service *services.ScanService) *ScanHandler {
	return &ScanHandler{service: service}
}

type createScanRequest struct {
	CompanyID uint `json:"companyId" binding:"required"`
}

// Create starts an async scan and returns 202 Accepted with the QUEUED scan.
func (h *ScanHandler) Create(c *gin.Context) {
	var req createScanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	// Prefer email from JWT for audit trail on the ScanJob.
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

	// Worker finishes later; client should poll GET /api/scans/:id.
	response.JSON(c, http.StatusAccepted, scan)
}

// List returns all scans (newest first), including company preload from the repo.
func (h *ScanHandler) List(c *gin.Context) {
	scans, err := h.service.List()
	if err != nil {
		response.Internal(c, "Internal error")
		return
	}
	response.JSON(c, http.StatusOK, scans)
}

// GetByID returns one scan with vulnerabilities (for Scan Details page + polling).
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
