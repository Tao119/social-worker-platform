package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/social-worker-platform/backend/models"
)

// CreatePlacementRequest handles POST /api/requests
func CreatePlacementRequest(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user from context (set by auth middleware)
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		role, exists := c.Get("userRole")
		if !exists || role != "hospital" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only hospital users can create placement requests"})
			return
		}

		// Get hospital ID for this user
		hospital, err := models.GetHospitalByUserID(db, userID.(int))
		if err != nil || hospital == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Hospital not found for this user"})
			return
		}

		var req struct {
			FacilityID       int    `json:"facility_id" binding:"required"`
			PatientAge       int    `json:"patient_age" binding:"required"`
			PatientGender    string `json:"patient_gender" binding:"required"`
			MedicalCondition string `json:"medical_condition" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validate facility exists
		facility, err := models.GetFacilityByID(db, req.FacilityID)
		if err != nil || facility == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Facility not found"})
			return
		}

		placementReq := &models.PlacementRequest{
			HospitalID:       hospital.ID,
			FacilityID:       req.FacilityID,
			PatientAge:       req.PatientAge,
			PatientGender:    req.PatientGender,
			MedicalCondition: req.MedicalCondition,
			Status:           "pending",
		}

		if err := models.CreatePlacementRequest(db, placementReq); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create placement request"})
			return
		}

		c.JSON(http.StatusCreated, placementReq)
	}
}

// GetPlacementRequests handles GET /api/requests
func GetPlacementRequests(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		role, exists := c.Get("userRole")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Role not found"})
			return
		}

		var requests []*models.PlacementRequest
		var err error

		if role == "hospital" {
			hospital, err := models.GetHospitalByUserID(db, userID.(int))
			if err != nil || hospital == nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Hospital not found"})
				return
			}
			log.Printf("Fetching requests for hospital ID: %d", hospital.ID)
			requests, err = models.GetPlacementRequestsByHospitalID(db, hospital.ID)
		} else if role == "facility" {
			facility, err := models.GetFacilityByUserID(db, userID.(int))
			if err != nil || facility == nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Facility not found"})
				return
			}
			log.Printf("Fetching requests for facility ID: %d", facility.ID)
			requests, err = models.GetPlacementRequestsByFacilityID(db, facility.ID)
		} else {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid role"})
			return
		}

		if err != nil {
			log.Printf("Error fetching requests: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve requests"})
			return
		}

		if requests == nil {
			requests = []*models.PlacementRequest{}
		}

		log.Printf("Returning %d requests", len(requests))
		c.JSON(http.StatusOK, requests)
	}
}

// GetPlacementRequestByID handles GET /api/requests/:id
func GetPlacementRequestByID(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		role, exists := c.Get("userRole")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Role not found"})
			return
		}

		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
			return
		}

		req, err := models.GetPlacementRequestByID(db, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve request"})
			return
		}

		if req == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
			return
		}

		// Check authorization
		if role == "hospital" {
			hospital, err := models.GetHospitalByUserID(db, userID.(int))
			if err != nil || hospital == nil || hospital.ID != req.HospitalID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
				return
			}
		} else if role == "facility" {
			facility, err := models.GetFacilityByUserID(db, userID.(int))
			if err != nil || facility == nil || facility.ID != req.FacilityID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
				return
			}
		} else {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid role"})
			return
		}

		c.JSON(http.StatusOK, req)
	}
}

// AcceptPlacementRequest handles POST /api/requests/:id/accept
func AcceptPlacementRequest(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		role, exists := c.Get("userRole")
		if !exists || role != "facility" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only facility users can accept requests"})
			return
		}

		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
			return
		}

		req, err := models.GetPlacementRequestByID(db, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve request"})
			return
		}

		if req == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
			return
		}

		// Check authorization
		facility, err := models.GetFacilityByUserID(db, userID.(int))
		if err != nil || facility == nil || facility.ID != req.FacilityID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}

		// Check if request is pending
		if req.Status != "pending" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Request is not pending"})
			return
		}

		// Update status to accepted
		if err := models.UpdatePlacementRequestStatus(db, id, "accepted"); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to accept request"})
			return
		}

		// Create message room
		room := &models.MessageRoom{
			RequestID:  id,
			HospitalID: req.HospitalID,
			FacilityID: req.FacilityID,
			Status:     "negotiating",
		}

		if err := models.CreateMessageRoom(db, room); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create message room"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Request accepted",
			"room_id": room.ID,
		})
	}
}

// RejectPlacementRequest handles POST /api/requests/:id/reject
func RejectPlacementRequest(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		role, exists := c.Get("userRole")
		if !exists || role != "facility" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only facility users can reject requests"})
			return
		}

		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
			return
		}

		req, err := models.GetPlacementRequestByID(db, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve request"})
			return
		}

		if req == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
			return
		}

		// Check authorization
		facility, err := models.GetFacilityByUserID(db, userID.(int))
		if err != nil || facility == nil || facility.ID != req.FacilityID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}

		// Check if request is pending
		if req.Status != "pending" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Request is not pending"})
			return
		}

		// Update status to rejected
		if err := models.UpdatePlacementRequestStatus(db, id, "rejected"); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject request"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Request rejected"})
	}
}

// UpdatePlacementRequest handles PUT /api/requests/:id
func UpdatePlacementRequest(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		role, exists := c.Get("userRole")
		if !exists || role != "hospital" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only hospital users can update requests"})
			return
		}

		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
			return
		}

		req, err := models.GetPlacementRequestByID(db, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve request"})
			return
		}

		if req == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
			return
		}

		// Check authorization
		hospital, err := models.GetHospitalByUserID(db, userID.(int))
		if err != nil || hospital == nil || hospital.ID != req.HospitalID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}

		// Can only update pending requests
		if req.Status != "pending" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Can only update pending requests"})
			return
		}

		var updateReq struct {
			PatientAge       int    `json:"patient_age" binding:"required"`
			PatientGender    string `json:"patient_gender" binding:"required"`
			MedicalCondition string `json:"medical_condition" binding:"required"`
		}

		if err := c.ShouldBindJSON(&updateReq); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := models.UpdatePlacementRequest(db, id, updateReq.PatientAge, updateReq.PatientGender, updateReq.MedicalCondition); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update request"})
			return
		}

		// Get updated request
		updatedReq, _ := models.GetPlacementRequestByID(db, id)
		c.JSON(http.StatusOK, updatedReq)
	}
}

// CancelPlacementRequest handles DELETE /api/requests/:id
func CancelPlacementRequest(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		role, exists := c.Get("userRole")
		if !exists || role != "hospital" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only hospital users can cancel requests"})
			return
		}

		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
			return
		}

		req, err := models.GetPlacementRequestByID(db, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve request"})
			return
		}

		if req == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
			return
		}

		// Check authorization
		hospital, err := models.GetHospitalByUserID(db, userID.(int))
		if err != nil || hospital == nil || hospital.ID != req.HospitalID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}

		// Can only cancel pending requests
		if req.Status != "pending" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Can only cancel pending requests"})
			return
		}

		// Delete the request
		if err := models.DeletePlacementRequest(db, id); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel request"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Request cancelled"})
	}
}
