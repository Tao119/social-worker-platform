package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/social-worker-platform/backend/config"
	"github.com/social-worker-platform/backend/handlers"
	"github.com/social-worker-platform/backend/middleware"
	"github.com/social-worker-platform/backend/models"
)

func main() {
	// Load configuration
	dbConfig := &config.DatabaseConfig{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "5432"),
		User:     getEnv("DB_USER", "postgres"),
		Password: getEnv("DB_PASSWORD", "postgres"),
		DBName:   getEnv("DB_NAME", "social_worker_platform"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
	}

	// Connect to database
	db, err := config.ConnectDatabase(dbConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize repositories
	userRepo := models.NewUserRepository(db)
	hospitalRepo := models.NewHospitalRepository(db)
	facilityRepo := models.NewFacilityRepository(db)
	documentRepo := models.NewDocumentRepository(db)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userRepo)
	facilityHandler := handlers.NewFacilityHandler(facilityRepo, userRepo)
	documentHandler := handlers.NewDocumentHandler(documentRepo)
	adminHandler := handlers.NewAdminHandler(hospitalRepo, facilityRepo, userRepo)

	// Setup Gin
	ginMode := getEnv("GIN_MODE", "debug")
	gin.SetMode(ginMode)
	router := gin.Default()

	// Apply middleware
	router.Use(middleware.CORSMiddleware())
	router.Use(middleware.LoggingMiddleware())
	router.Use(middleware.RecoveryMiddleware())
	router.Use(middleware.ErrorHandlingMiddleware())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Authentication routes
	auth := router.Group("/api/auth")
	{
		auth.POST("/login", authHandler.Login)
		auth.POST("/logout", authHandler.Logout)
		auth.GET("/me", middleware.AuthMiddleware(), authHandler.GetCurrentUser)
	}

	// Facility routes
	facilities := router.Group("/api/facilities")
	{
		facilities.POST("", middleware.AuthMiddleware(), middleware.RequireRole("facility"), facilityHandler.Create)
		facilities.GET("", middleware.AuthMiddleware(), middleware.RequireRole("hospital"), facilityHandler.List)
		facilities.GET("/me", middleware.AuthMiddleware(), middleware.RequireRole("facility"), facilityHandler.GetMyFacility)
		facilities.GET("/:id", middleware.AuthMiddleware(), middleware.RequireRole("hospital"), facilityHandler.GetByID)
		facilities.PUT("/:id", middleware.AuthMiddleware(), middleware.RequireRole("facility", "admin"), facilityHandler.Update)
	}

	// Document routes
	documents := router.Group("/api/documents")
	documents.Use(middleware.AuthMiddleware())
	{
		documents.POST("", documentHandler.Upload)
		documents.GET("", documentHandler.List)
		documents.GET("/:id", documentHandler.GetByID)
		documents.GET("/:id/download", documentHandler.Download)
	}

	// Admin routes
	admin := router.Group("/api/admin")
	admin.Use(middleware.AuthMiddleware(), middleware.RequireRole("admin"))
	{
		// Hospital management
		admin.POST("/hospitals", adminHandler.CreateHospital)
		admin.GET("/hospitals", adminHandler.ListHospitals)
		admin.PUT("/hospitals/:id", adminHandler.UpdateHospital)
		admin.DELETE("/hospitals/:id", adminHandler.DeleteHospital)

		// Facility management
		admin.POST("/facilities", adminHandler.CreateFacility)
		admin.GET("/facilities", adminHandler.ListFacilities)
		admin.PUT("/facilities/:id", adminHandler.UpdateFacility)
		admin.DELETE("/facilities/:id", adminHandler.DeleteFacility)
	}

	// Start server
	port := getEnv("PORT", "8080")
	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
