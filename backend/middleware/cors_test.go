package middleware

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestCORSMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("allows configured origin", func(t *testing.T) {
		os.Setenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://example.com")
		defer os.Unsetenv("CORS_ALLOWED_ORIGINS")

		router := gin.New()
		router.Use(CORSMiddleware())
		router.GET("/test", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		req, _ := http.NewRequest("GET", "/test", nil)
		req.Header.Set("Origin", "http://localhost:3000")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "http://localhost:3000", w.Header().Get("Access-Control-Allow-Origin"))
		assert.Equal(t, "true", w.Header().Get("Access-Control-Allow-Credentials"))
	})

	t.Run("rejects non-configured origin", func(t *testing.T) {
		os.Setenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
		defer os.Unsetenv("CORS_ALLOWED_ORIGINS")

		router := gin.New()
		router.Use(CORSMiddleware())
		router.GET("/test", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		req, _ := http.NewRequest("GET", "/test", nil)
		req.Header.Set("Origin", "http://malicious.com")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Empty(t, w.Header().Get("Access-Control-Allow-Origin"))
	})

	t.Run("handles OPTIONS preflight request", func(t *testing.T) {
		os.Setenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
		defer os.Unsetenv("CORS_ALLOWED_ORIGINS")

		router := gin.New()
		router.Use(CORSMiddleware())
		router.GET("/test", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		req, _ := http.NewRequest("OPTIONS", "/test", nil)
		req.Header.Set("Origin", "http://localhost:3000")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNoContent, w.Code)
		assert.Equal(t, "http://localhost:3000", w.Header().Get("Access-Control-Allow-Origin"))
	})

	t.Run("uses default origin when not configured", func(t *testing.T) {
		os.Unsetenv("CORS_ALLOWED_ORIGINS")

		router := gin.New()
		router.Use(CORSMiddleware())
		router.GET("/test", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		req, _ := http.NewRequest("GET", "/test", nil)
		req.Header.Set("Origin", "http://localhost:3000")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "http://localhost:3000", w.Header().Get("Access-Control-Allow-Origin"))
	})
}
