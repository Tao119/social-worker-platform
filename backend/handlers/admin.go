package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/social-worker-platform/backend/models"
)

type AdminHandler struct {
	hospitalRepo *models.HospitalRepository
	facilityRepo *models.FacilityRepository
	userRepo     *models.UserRepository
}

func NewAdminHandler(hospitalRepo *models.HospitalRepository, facilityRepo *models.FacilityRepository, userRepo *models.UserRepository) *AdminHandler {
	return &AdminHandler{
		hospitalRepo: hospitalRepo,
		facilityRepo: facilityRepo,
		userRepo:     userRepo,
	}
}

type CreateHospitalRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Name     string `json:"name" binding:"required"`
	Address  string `json:"address"`
	Phone    string `json:"phone"`
}

type CreateFacilityAdminRequest struct {
	Email                string `json:"email" binding:"required,email"`
	Password             string `json:"password" binding:"required,min=8"`
	Name                 string `json:"name" binding:"required"`
	Address              string `json:"address"`
	Phone                string `json:"phone"`
	BedCapacity          int    `json:"bed_capacity" binding:"required,min=0"`
	AcceptanceConditions string `json:"acceptance_conditions"`
}

type UpdateHospitalRequest struct {
	Name    string `json:"name"`
	Address string `json:"address"`
	Phone   string `json:"phone"`
}

type UpdateFacilityAdminRequest struct {
	Name                 string `json:"name"`
	Address              string `json:"address"`
	Phone                string `json:"phone"`
	BedCapacity          int    `json:"bed_capacity" binding:"min=0"`
	AcceptanceConditions string `json:"acceptance_conditions"`
}

// Hospital Management

func (h *AdminHandler) CreateHospital(c *gin.Context) {
	var req CreateHospitalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	// Create user account
	user, err := h.userRepo.Create(req.Email, req.Password, "hospital")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user account"})
		return
	}

	// Create hospital profile
	hospital, err := h.hospitalRepo.Create(user.ID, req.Name, req.Address, req.Phone)
	if err != nil {
		h.userRepo.Delete(user.ID) // Rollback user creation
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create hospital profile"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"user":     user,
		"hospital": hospital,
	})
}

func (h *AdminHandler) ListHospitals(c *gin.Context) {
	hospitals, err := h.hospitalRepo.GetAllWithEmail()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve hospitals"})
		return
	}

	c.JSON(http.StatusOK, hospitals)
}

func (h *AdminHandler) UpdateHospital(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid hospital ID"})
		return
	}

	hospital, err := h.hospitalRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Hospital not found"})
		return
	}

	var req UpdateHospitalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	if req.Name != "" {
		hospital.Name = req.Name
	}
	if req.Address != "" {
		hospital.Address = req.Address
	}
	if req.Phone != "" {
		hospital.Phone = req.Phone
	}

	if err := h.hospitalRepo.Update(hospital); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update hospital"})
		return
	}

	c.JSON(http.StatusOK, hospital)
}

func (h *AdminHandler) DeleteHospital(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid hospital ID"})
		return
	}

	hospital, err := h.hospitalRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Hospital not found"})
		return
	}

	// Mark user as inactive instead of deleting
	user, err := h.userRepo.GetByID(hospital.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		return
	}

	user.IsActive = false
	if err := h.userRepo.Update(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deactivate account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Hospital account deactivated successfully"})
}

// Facility Management

func (h *AdminHandler) CreateFacility(c *gin.Context) {
	var req CreateFacilityAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	// Create user account
	user, err := h.userRepo.Create(req.Email, req.Password, "facility")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user account"})
		return
	}

	// Create facility profile
	facility, err := h.facilityRepo.Create(
		user.ID,
		req.Name,
		req.Address,
		req.Phone,
		req.BedCapacity,
		req.AcceptanceConditions,
	)
	if err != nil {
		h.userRepo.Delete(user.ID) // Rollback user creation
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create facility profile"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"user":     user,
		"facility": facility,
	})
}

func (h *AdminHandler) ListFacilities(c *gin.Context) {
	facilities, err := h.facilityRepo.GetAllWithEmail()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve facilities"})
		return
	}

	c.JSON(http.StatusOK, facilities)
}

func (h *AdminHandler) UpdateFacility(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid facility ID"})
		return
	}

	facility, err := h.facilityRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Facility not found"})
		return
	}

	var req UpdateFacilityAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	if req.Name != "" {
		facility.Name = req.Name
	}
	if req.Address != "" {
		facility.Address = req.Address
	}
	if req.Phone != "" {
		facility.Phone = req.Phone
	}
	if req.BedCapacity > 0 {
		facility.BedCapacity = req.BedCapacity
	}
	if req.AcceptanceConditions != "" {
		facility.AcceptanceConditions = req.AcceptanceConditions
	}

	if err := h.facilityRepo.Update(facility); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update facility"})
		return
	}

	c.JSON(http.StatusOK, facility)
}

func (h *AdminHandler) DeleteFacility(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid facility ID"})
		return
	}

	facility, err := h.facilityRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Facility not found"})
		return
	}

	// Mark user as inactive instead of deleting
	user, err := h.userRepo.GetByID(facility.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		return
	}

	user.IsActive = false
	if err := h.userRepo.Update(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deactivate account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Facility account deactivated successfully"})
}
