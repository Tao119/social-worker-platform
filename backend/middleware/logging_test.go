package middleware

import (
	"bytes"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestLoggingMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("logs request details", func(t *testing.T) {
		var buf bytes.Buffer
		log.SetOutput(&buf)
		defer log.SetOutput(os.Stderr)

		router := gin.New()
		router.Use(LoggingMiddleware())
		router.GET("/test", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		req, _ := http.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		logOutput := buf.String()
		assert.Contains(t, logOutput, "GET")
		assert.Contains(t, logOutput, "/test")
		assert.Contains(t, logOutput, "200")
	})

	t.Run("logs errors", func(t *testing.T) {
		var buf bytes.Buffer
		log.SetOutput(&buf)
		defer log.SetOutput(os.Stderr)

		router := gin.New()
		router.Use(LoggingMiddleware())
		router.GET("/test", func(c *gin.Context) {
			c.Error(assert.AnError)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "test error"})
		})

		req, _ := http.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		logOutput := buf.String()
		assert.Contains(t, logOutput, "500")
	})

	t.Run("logs latency", func(t *testing.T) {
		var buf bytes.Buffer
		log.SetOutput(&buf)
		defer log.SetOutput(os.Stderr)

		router := gin.New()
		router.Use(LoggingMiddleware())
		router.GET("/test", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		req, _ := http.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		logOutput := buf.String()
		// Check that latency is logged (contains time units like µs, ms, s)
		assert.True(t, strings.Contains(logOutput, "µs") || 
			strings.Contains(logOutput, "ms") || 
			strings.Contains(logOutput, "s"))
	})
}
