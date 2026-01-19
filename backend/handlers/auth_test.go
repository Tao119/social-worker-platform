package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/social-worker-platform/backend/config"
	"github.com/social-worker-platform/backend/middleware"
	"github.com/social-worker-platform/backend/models"
	"github.com/stretchr/testify/assert"
)

func setupAuthTest(t *testing.T) (*gin.Engine, *models.UserRepository, func()) {
	os.Setenv("JWT_SECRET", "test-secret-key")
	
	db := config.SetupTestDatabase(t)
	userRepo := models.NewUserRepository(db)
	authHandler := NewAuthHandler(userRepo)

	gin.SetMode(gin.TestMode)
	router := gin.New()

	router.POST("/api/auth/login", authHandler.Login)
	router.POST("/api/auth/logout", authHandler.Logout)
	router.GET("/api/auth/me", middleware.AuthMiddleware(), authHandler.GetCurrentUser)

	cleanup := func() {
		config.TeardownTestDatabase(t, db)
		os.Unsetenv("JWT_SECRET")
	}

	return router, userRepo, cleanup
}

func TestLogin(t *testing.T) {
	router, userRepo, cleanup := setupAuthTest(t)
	defer cleanup()

	t.Run("successful login with valid credentials", func(t *testing.T) {
		user, _ := userRepo.Create("test@example.com", "password123", "hospital")

		reqBody := LoginRequest{
			Email:    "test@example.com",
			Password: "password123",
		}
		body, _ := json.Marshal(reqBody)

		req, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response LoginResponse
		json.Unmarshal(w.Body.Bytes(), &response)

		assert.NotEmpty(t, response.Token)
		assert.Equal(t, user.ID, response.User.ID)
		assert.Equal(t, user.Email, response.User.Email)
		assert.Equal(t, user.Role, response.User.Role)
		assert.True(t, response.User.IsActive)
	})

	t.Run("login fails with invalid email", func(t *testing.T) {
		reqBody := LoginRequest{
			Email:    "nonexistent@example.com",
			Password: "password123",
		}
		body, _ := json.Marshal(reqBody)

		req, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("login fails with invalid password", func(t *testing.T) {
		userRepo.Create("test2@example.com", "password123", "hospital")

		reqBody := LoginRequest{
			Email:    "test2@example.com",
			Password: "wrongpassword",
		}
		body, _ := json.Marshal(reqBody)

		req, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("login fails with inactive account", func(t *testing.T) {
		user, _ := userRepo.Create("inactive@example.com", "password123", "hospital")
		user.IsActive = false
		userRepo.Update(user)

		reqBody := LoginRequest{
			Email:    "inactive@example.com",
			Password: "password123",
		}
		body, _ := json.Marshal(reqBody)

		req, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("login fails with invalid request format", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer([]byte("invalid json")))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestLogout(t *testing.T) {
	router, _, cleanup := setupAuthTest(t)
	defer cleanup()

	t.Run("logout returns success", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/api/auth/logout", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}

func TestGetCurrentUser(t *testing.T) {
	router, userRepo, cleanup := setupAuthTest(t)
	defer cleanup()

	t.Run("returns current user with valid token", func(t *testing.T) {
		user, _ := userRepo.Create("current@example.com", "password123", "hospital")
		token, _ := middleware.GenerateToken(user.ID, user.Email, user.Role)

		req, _ := http.NewRequest("GET", "/api/auth/me", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response UserProfile
		json.Unmarshal(w.Body.Bytes(), &response)

		assert.Equal(t, user.ID, response.ID)
		assert.Equal(t, user.Email, response.Email)
		assert.Equal(t, user.Role, response.Role)
		assert.True(t, response.IsActive)
	})

	t.Run("fails without authorization header", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/auth/me", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("fails with invalid token", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/auth/me", nil)
		req.Header.Set("Authorization", "Bearer invalid-token")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("fails with inactive user", func(t *testing.T) {
		user, _ := userRepo.Create("inactive2@example.com", "password123", "hospital")
		token, _ := middleware.GenerateToken(user.ID, user.Email, user.Role)
		
		user.IsActive = false
		userRepo.Update(user)

		req, _ := http.NewRequest("GET", "/api/auth/me", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}
