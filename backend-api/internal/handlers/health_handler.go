package handlers

import (
	"net/http"

	"github.com/cyberwatch/backend-api/internal/response"
	"github.com/gin-gonic/gin"
)

// Health is public (no JWT) — used by Docker healthchecks and load balancers.
func Health(c *gin.Context) {
	response.JSON(c, http.StatusOK, gin.H{"status": "ok"})
}
