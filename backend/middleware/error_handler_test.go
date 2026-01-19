package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestRecoveryMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("recovers from panic", func(t *testing.T) {
		router := gin.New()
		router.Use(RecoveryMiddleware())
		router.GET("/panic", func(c *gin.Context) {
			panic("test panic")
		})

		req, _ := http.NewRequest("GET", "/panic", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)

		var response ErrorResponse
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "Internal server error", response.Error)
		assert.Equal(t, http.StatusInternalServerError, response.Code)
	})

	t.Run("does not interfere with normal requests", func(t *testing.T) {
		router := gin.New()
		router.Use(RecoveryMiddleware())
		router.GET("/normal", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		req, _ := http.NewRequest("GET", "/normal", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}

func TestErrorHandlingMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("handles errors added to context", func(t *testing.T) {
		router := gin.New()
		router.Use(ErrorHandlingMiddleware())
		router.GET("/error", func(c *gin.Context) {
			c.Error(assert.AnError).SetMeta("Test error message")
			c.Status(http.StatusBadRequest)
		})

		req, _ := http.NewRequest("GET", "/error", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response ErrorResponse
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.NotEmpty(t, response.Error)
		assert.Equal(t, http.StatusBadRequest, response.Code)
	})

	t.Run("does not interfere when no errors", func(t *testing.T) {
		router := gin.New()
		router.Use(ErrorHandlingMiddleware())
		router.GET("/success", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		req, _ := http.NewRequest("GET", "/success", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}
