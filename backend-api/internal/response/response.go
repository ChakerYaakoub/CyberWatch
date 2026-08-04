package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type SuccessEnvelope struct {
	Data any `json:"data"`
}

type ErrorEnvelope struct {
	Error string `json:"error"`
}

func JSON(c *gin.Context, status int, data any) {
	c.JSON(status, SuccessEnvelope{Data: data})
}

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
