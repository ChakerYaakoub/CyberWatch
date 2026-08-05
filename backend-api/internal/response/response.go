// Package response standardizes API JSON envelopes for the React client.
package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// SuccessEnvelope is {"data": <payload>} — frontend unwrapData() reads .data.
type SuccessEnvelope struct {
	Data any `json:"data"`
}

// ErrorEnvelope is {"error": "<message>"}.
type ErrorEnvelope struct {
	Error string `json:"error"`
}

// JSON wraps success payloads as {"data": ...}.
func JSON(c *gin.Context, status int, data any) {
	c.JSON(status, SuccessEnvelope{Data: data})
}

// Error aborts with {"error": "..."}.
func Error(c *gin.Context, status int, message string) {
	c.AbortWithStatusJSON(status, ErrorEnvelope{Error: message})
}

func BadRequest(c *gin.Context, message string) {
	Error(c, http.StatusBadRequest, message)
}

func NotFound(c *gin.Context, message string) {
	Error(c, http.StatusNotFound, message)
}

func Internal(c *gin.Context, message string) {
	Error(c, http.StatusInternalServerError, message)
}
