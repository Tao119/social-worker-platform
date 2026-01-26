package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/social-worker-platform/backend/models"
)

type FacilityHandler struct {
	facilityRepo *models.FacilityRepository
	userRepo     *models.UserRepository
}

func NewFacilityHandler(facilityRepo *models.FacilityRepository, userRepo *models.UserRepository) *FacilityHandler {
	return &FacilityHandler{
		facilityRepo: facilityRepo,
		userRepo:     userRepo,
	}
}

type CreateFacilityRequest struct {
	Name                 string `json:"name" binding:"required"`
	Address              string `json:"address"`
	Phone                string `json:"phone"`
	BedCapacity          int    `json:"bed_capacity" binding:"required,min=0"`
	AcceptanceConditions string `json:"acceptance_conditions"`
}

type UpdateFacilityRequest struct {
	Name                 string `json:"name"`
	Address              string `json:"address"`
	Phone                string `json:"phone"`
	BedCapacity          int    `json:"bed_capacity" binding:"min=0"`
	AvailableBeds        int    `json:"available_beds" binding:"min=0"`
	AcceptanceConditions string `json:"acceptance_conditions"`
}

type SearchFacilityRequest struct {
	Name              string `form:"name"`
	Address           string `form:"address"`
	HasAvailableBeds  bool   `form:"has_available_beds"`
}

func (h *FacilityHandler) Create(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req CreateFacilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	facility, err := h.facilityRepo.Create(
		userID.(int),
		req.Name,
		req.Address,
		req.Phone,
		req.BedCapacity,
		req.AcceptanceConditions,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create facility"})
		return
	}

	c.JSON(http.StatusCreated, facility)
}

func (h *FacilityHandler) List(c *gin.Context) {
	var req SearchFacilityRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query parameters"})
		return
	}

	facilities, err := h.facilityRepo.Search(req.Name, req.Address, req.HasAvailableBeds)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve facilities"})
		return
	}

	c.JSON(http.StatusOK, facilities)
}

func (h *FacilityHandler) GetByID(c *gin.Context) {
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

	c.JSON(http.StatusOK, facility)
}

func (h *FacilityHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid facility ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userRole, _ := c.Get("userRole")

	facility, err := h.facilityRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Facility not found"})
		return
	}

	if userRole != "admin" && facility.UserID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to update this facility"})
		return
	}

	var req UpdateFacilityRequest
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
	if req.AvailableBeds >= 0 {
		facility.AvailableBeds = req.AvailableBeds
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

func (h *FacilityHandler) GetMyFacility(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	facility, err := h.facilityRepo.GetByUserID(userID.(int))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Facility not found"})
		return
	}

	c.JSON(http.StatusOK, facility)
}
