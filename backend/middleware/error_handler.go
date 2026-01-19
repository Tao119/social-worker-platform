package middleware

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    int    `json:"code"`
}

func ErrorHandlingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) > 0 {
			err := c.Errors.Last()
			
			log.Printf("Error occurred: %v", err.Err)

			statusCode := c.Writer.Status()
			if statusCode == http.StatusOK {
				statusCode = http.StatusInternalServerError
			}

			response := ErrorResponse{
				Error:   err.Error(),
				Message: err.Meta.(string),
				Code:    statusCode,
			}

			c.JSON(statusCode, response)
			return
		}
	}
}

func RecoveryMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("Panic recovered: %v", err)

				c.JSON(http.StatusInternalServerError, ErrorResponse{
					Error:   "Internal server error",
					Message: "An unexpected error occurred",
					Code:    http.StatusInternalServerError,
				})

				c.Abort()
			}
		}()

		c.Next()
	}
}
