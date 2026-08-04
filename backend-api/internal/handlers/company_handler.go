package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/cyberwatch/backend-api/internal/response"
	"github.com/cyberwatch/backend-api/internal/services"
	"github.com/gin-gonic/gin"
)

type CompanyHandler struct {
	service *services.CompanyService
}

func NewCompanyHandler(service *services.CompanyService) *CompanyHandler {
	return &CompanyHandler{service: service}
}

type createCompanyRequest struct {
	Name   string `json:"name" binding:"required"`
	Domain string `json:"domain" binding:"required"`
}

type updateCompanyRequest struct {
	Name   string `json:"name" binding:"required"`
	Domain string `json:"domain" binding:"required"`
}

func (h *CompanyHandler) Create(c *gin.Context) {
	var req createCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	company, err := h.service.Create(services.CreateCompanyInput{
		Name:   req.Name,
		Domain: req.Domain,
	})
	if err != nil {
		handleServiceError(c, err)
		return
	}

	response.JSON(c, http.StatusCreated, company)
}

func (h *CompanyHandler) List(c *gin.Context) {
	companies, err := h.service.List()
	if err != nil {
		response.Internal(c, "Internal error")
		return
	}
	response.JSON(c, http.StatusOK, companies)
}

func (h *CompanyHandler) GetByID(c *gin.Context) {
	id, err := parseID(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	company, err := h.service.GetByID(id)
	if err != nil {
		handleServiceError(c, err)
		return
	}

	response.JSON(c, http.StatusOK, company)
}

func (h *CompanyHandler) Update(c *gin.Context) {
	id, err := parseID(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	var req updateCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	company, err := h.service.Update(id, services.UpdateCompanyInput{
		Name:   req.Name,
		Domain: req.Domain,
	})
	if err != nil {
		handleServiceError(c, err)
		return
	}

	response.JSON(c, http.StatusOK, company)
}

func (h *CompanyHandler) Delete(c *gin.Context) {
	id, err := parseID(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	if err := h.service.Delete(id); err != nil {
		handleServiceError(c, err)
		return
	}

	response.JSON(c, http.StatusOK, gin.H{"deleted": true})
}

func parseID(raw string) (uint, error) {
	value, err := strconv.ParseUint(raw, 10, 64)
	if err != nil || value == 0 {
		return 0, errors.New("invalid id")
	}
	return uint(value), nil
}

func handleServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, services.ErrInvalidInput):
		response.BadRequest(c, err.Error())
	case errors.Is(err, services.ErrCompanyExists):
		response.Error(c, http.StatusConflict, err.Error())
	case errors.Is(err, services.ErrCompanyMissing), errors.Is(err, services.ErrScanMissing):
		response.NotFound(c, err.Error())
	default:
		response.Internal(c, "Internal error")
	}
}
