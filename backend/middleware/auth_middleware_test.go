package middleware

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func setupMiddlewareTest() *gin.Engine {
	os.Setenv("JWT_SECRET", "test-secret-key")
	gin.SetMode(gin.TestMode)
	router := gin.New()
	return router
}

func TestAuthMiddleware(t *testing.T) {
	router := setupMiddlewareTest()
	defer os.Unsetenv("JWT_SECRET")

	router.GET("/protected", AuthMiddleware(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	t.Run("allows request with valid token", func(t *testing.T) {
		token, _ := GenerateToken(1, "test@example.com", "hospital")

		req, _ := http.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("rejects request without authorization header", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/protected", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("rejects request with invalid authorization format", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "InvalidFormat token")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("rejects request with invalid token", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "Bearer invalid-token")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("sets claims in context", func(t *testing.T) {
		token, _ := GenerateToken(123, "test@example.com", "hospital")

		router.GET("/check-claims", AuthMiddleware(), func(c *gin.Context) {
			claims, exists := c.Get("claims")
			assert.True(t, exists)

			userClaims, ok := claims.(*Claims)
			assert.True(t, ok)
			assert.Equal(t, 123, userClaims.UserID)
			assert.Equal(t, "test@example.com", userClaims.Email)
			assert.Equal(t, "hospital", userClaims.Role)

			userID, _ := c.Get("userID")
			assert.Equal(t, 123, userID)

			userEmail, _ := c.Get("userEmail")
			assert.Equal(t, "test@example.com", userEmail)

			userRole, _ := c.Get("userRole")
			assert.Equal(t, "hospital", userRole)

			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		req, _ := http.NewRequest("GET", "/check-claims", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}

func TestRequireRole(t *testing.T) {
	router := setupMiddlewareTest()
	defer os.Unsetenv("JWT_SECRET")

	router.GET("/admin-only", AuthMiddleware(), RequireRole("admin"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "admin access"})
	})

	router.GET("/hospital-or-facility", AuthMiddleware(), RequireRole("hospital", "facility"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "hospital or facility access"})
	})

	t.Run("allows access with correct role", func(t *testing.T) {
		token, _ := GenerateToken(1, "admin@example.com", "admin")

		req, _ := http.NewRequest("GET", "/admin-only", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("denies access with incorrect role", func(t *testing.T) {
		token, _ := GenerateToken(1, "hospital@example.com", "hospital")

		req, _ := http.NewRequest("GET", "/admin-only", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusForbidden, w.Code)
	})

	t.Run("allows access with one of multiple allowed roles", func(t *testing.T) {
		token, _ := GenerateToken(1, "hospital@example.com", "hospital")

		req, _ := http.NewRequest("GET", "/hospital-or-facility", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("allows access with another allowed role", func(t *testing.T) {
		token, _ := GenerateToken(1, "facility@example.com", "facility")

		req, _ := http.NewRequest("GET", "/hospital-or-facility", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}
