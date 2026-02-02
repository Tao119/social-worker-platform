package handlers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/social-worker-platform/backend/models"
	"github.com/social-worker-platform/backend/services"
)

type FacilityHandler struct {
	facilityRepo     *models.FacilityRepository
	userRepo         *models.UserRepository
	geocodingService *services.GeocodingService
}

func NewFacilityHandler(facilityRepo *models.FacilityRepository, userRepo *models.UserRepository) *FacilityHandler {
	return &FacilityHandler{
		facilityRepo:     facilityRepo,
		userRepo:         userRepo,
		geocodingService: services.NewGeocodingService(),
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
	Name                 string   `json:"name"`
	Address              string   `json:"address"`
	Phone                string   `json:"phone"`
	BedCapacity          *int     `json:"bed_capacity" binding:"omitempty,min=0"`
	AvailableBeds        *int     `json:"available_beds" binding:"omitempty,min=0"`
	AcceptanceConditions string   `json:"acceptance_conditions"`
	Latitude             *float64 `json:"latitude"`
	Longitude            *float64 `json:"longitude"`
	MonthlyFee           *int     `json:"monthly_fee" binding:"omitempty,min=0"`
	MedicineCost         *int     `json:"medicine_cost" binding:"omitempty,min=0"`
}

type SearchFacilityRequest struct {
	Name             string   `form:"name"`
	Address          string   `form:"address"`
	HasAvailableBeds bool     `form:"has_available_beds"`
	Latitude         *float64 `form:"latitude"`
	Longitude        *float64 `form:"longitude"`
	MaxDistanceKm    *float64 `form:"max_distance_km"`
	MinMonthlyFee    *int     `form:"min_monthly_fee"`
	MaxMonthlyFee    *int     `form:"max_monthly_fee"`
	MinMedicineCost  *int     `form:"min_medicine_cost"`
	MaxMedicineCost  *int     `form:"max_medicine_cost"`
	SortBy           string   `form:"sort_by"`    // distance, monthly_fee, medicine_cost, available_beds
	SortOrder        string   `form:"sort_order"` // asc, desc
	// Acceptance conditions filters
	Ventilator    *bool `form:"ventilator"`
	IvAntibiotics *bool `form:"iv_antibiotics"`
	TubeFeeding   *bool `form:"tube_feeding"`
	Tracheostomy  *bool `form:"tracheostomy"`
	Dialysis      *bool `form:"dialysis"`
	Oxygen        *bool `form:"oxygen"`
	PressureUlcer *bool `form:"pressure_ulcer"`
	Dementia      *bool `form:"dementia"`
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

	// 住所から自動で緯度経度を取得
	if req.Address != "" {
		result, err := h.geocodingService.GeocodeAddress(req.Address)
		if err != nil {
			log.Printf("Geocoding error for address '%s': %v", req.Address, err)
		} else if result.Found {
			facility.Latitude = &result.Latitude
			facility.Longitude = &result.Longitude
			if err := h.facilityRepo.Update(facility); err != nil {
				log.Printf("Failed to update facility with coordinates: %v", err)
			}
		}
	}

	c.JSON(http.StatusCreated, facility)
}

func (h *FacilityHandler) List(c *gin.Context) {
	var req SearchFacilityRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query parameters", "details": err.Error()})
		return
	}

	// Validate: both latitude and longitude must be provided together
	if (req.Latitude != nil) != (req.Longitude != nil) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Both latitude and longitude are required for distance search"})
		return
	}

	// Validate: max_distance_km must be positive
	if req.MaxDistanceKm != nil && *req.MaxDistanceKm <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "max_distance_km must be positive"})
		return
	}

	params := models.FacilitySearchParams{
		Name:             req.Name,
		Address:          req.Address,
		HasAvailableBeds: req.HasAvailableBeds,
		UserLatitude:     req.Latitude,
		UserLongitude:    req.Longitude,
		MaxDistanceKm:    req.MaxDistanceKm,
		MinMonthlyFee:    req.MinMonthlyFee,
		MaxMonthlyFee:    req.MaxMonthlyFee,
		MinMedicineCost:  req.MinMedicineCost,
		MaxMedicineCost:  req.MaxMedicineCost,
		SortBy:           req.SortBy,
		SortOrder:        req.SortOrder,
		// Acceptance conditions
		Ventilator:    req.Ventilator,
		IvAntibiotics: req.IvAntibiotics,
		TubeFeeding:   req.TubeFeeding,
		Tracheostomy:  req.Tracheostomy,
		Dialysis:      req.Dialysis,
		Oxygen:        req.Oxygen,
		PressureUlcer: req.PressureUlcer,
		Dementia:      req.Dementia,
	}

	facilities, err := h.facilityRepo.SearchAdvanced(params)
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

	addressChanged := false
	if req.Name != "" {
		facility.Name = req.Name
	}
	if req.Address != "" && req.Address != facility.Address {
		facility.Address = req.Address
		addressChanged = true
	}
	if req.Phone != "" {
		facility.Phone = req.Phone
	}
	if req.BedCapacity != nil && *req.BedCapacity >= 0 {
		facility.BedCapacity = *req.BedCapacity
	}
	if req.AvailableBeds != nil && *req.AvailableBeds >= 0 {
		facility.AvailableBeds = *req.AvailableBeds
	}
	if req.AcceptanceConditions != "" {
		facility.AcceptanceConditions = req.AcceptanceConditions
	}
	if req.Latitude != nil {
		facility.Latitude = req.Latitude
	}
	if req.Longitude != nil {
		facility.Longitude = req.Longitude
	}
	if req.MonthlyFee != nil {
		facility.MonthlyFee = req.MonthlyFee
	}
	if req.MedicineCost != nil {
		facility.MedicineCost = req.MedicineCost
	}

	// 住所が変更された場合は自動で緯度経度を更新（手動で緯度経度が指定されていない場合のみ）
	if addressChanged && req.Latitude == nil && req.Longitude == nil {
		result, err := h.geocodingService.GeocodeAddress(req.Address)
		if err != nil {
			log.Printf("Geocoding error for address '%s': %v", req.Address, err)
		} else if result.Found {
			facility.Latitude = &result.Latitude
			facility.Longitude = &result.Longitude
		}
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

type UpdateFacilityImagesRequest struct {
	Images []models.FacilityImageInput `json:"images" binding:"required"`
}

func (h *FacilityHandler) UpdateImages(c *gin.Context) {
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

	var req UpdateFacilityImagesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	if err := h.facilityRepo.UpdateFacilityImages(id, req.Images); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update images"})
		return
	}

	// Return updated facility with images
	updatedFacility, err := h.facilityRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get updated facility"})
		return
	}

	c.JSON(http.StatusOK, updatedFacility)
}

// GetRoomTypes returns all room types for a facility
func (h *FacilityHandler) GetRoomTypes(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid facility ID"})
		return
	}

	roomTypes, err := h.facilityRepo.GetRoomTypesByFacilityID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get room types"})
		return
	}

	c.JSON(http.StatusOK, roomTypes)
}

type UpdateRoomTypesRequest struct {
	RoomTypes []models.FacilityRoomTypeInput `json:"room_types" binding:"required"`
}

// UpdateRoomTypes updates all room types for a facility
func (h *FacilityHandler) UpdateRoomTypes(c *gin.Context) {
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

	var req UpdateRoomTypesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	if err := h.facilityRepo.UpdateRoomTypes(id, req.RoomTypes); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Return updated room types
	roomTypes, err := h.facilityRepo.GetRoomTypesByFacilityID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get updated room types"})
		return
	}

	c.JSON(http.StatusOK, roomTypes)
}
