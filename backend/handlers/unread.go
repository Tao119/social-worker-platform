package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/social-worker-platform/backend/models"
)

// GetUnreadCounts handles GET /api/unread
func GetUnreadCounts(db *sql.DB) gin.HandlerFunc {
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

		var entityID int
		roleStr := role.(string)

		if roleStr == "hospital" {
			hospital, err := models.GetHospitalByUserID(db, userID.(int))
			if err != nil || hospital == nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Hospital not found"})
				return
			}
			entityID = hospital.ID
		} else if roleStr == "facility" {
			facility, err := models.GetFacilityByUserID(db, userID.(int))
			if err != nil || facility == nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Facility not found"})
				return
			}
			entityID = facility.ID
		} else {
			// Admin or other roles have no unread counts
			c.JSON(http.StatusOK, models.UnreadCounts{Messages: 0, Requests: 0})
			return
		}

		counts, err := models.GetUnreadCounts(db, userID.(int), roleStr, entityID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get unread counts"})
			return
		}

		c.JSON(http.StatusOK, counts)
	}
}

// MarkRoomAsRead handles POST /api/rooms/:id/read
func MarkRoomAsRead(db *sql.DB) gin.HandlerFunc {
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

		roomID := c.Param("id")

		// Verify room exists and user has access
		room, err := models.GetMessageRoomByID(db, roomID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve room"})
			return
		}

		if room == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
			return
		}

		// Check authorization
		authorized := false
		if role == "hospital" {
			hospital, err := models.GetHospitalByUserID(db, userID.(int))
			if err == nil && hospital != nil && hospital.ID == room.HospitalID {
				authorized = true
			}
		} else if role == "facility" {
			facility, err := models.GetFacilityByUserID(db, userID.(int))
			if err == nil && facility != nil && facility.ID == room.FacilityID {
				authorized = true
			}
		}

		if !authorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}

		// Mark as read
		if err := models.MarkRoomAsRead(db, roomID, userID.(int)); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark room as read"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Room marked as read"})
	}
}

// MarkRequestAsRead handles POST /api/requests/:id/read
func MarkRequestAsRead(db *sql.DB) gin.HandlerFunc {
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

		requestID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
			return
		}

		// Verify request exists and user has access
		request, err := models.GetPlacementRequestByID(db, requestID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve request"})
			return
		}

		if request == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
			return
		}

		// Check authorization
		authorized := false
		if role == "hospital" {
			hospital, err := models.GetHospitalByUserID(db, userID.(int))
			if err == nil && hospital != nil && hospital.ID == request.HospitalID {
				authorized = true
			}
		} else if role == "facility" {
			facility, err := models.GetFacilityByUserID(db, userID.(int))
			if err == nil && facility != nil && facility.ID == request.FacilityID {
				authorized = true
			}
		}

		if !authorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}

		// Mark as read
		if err := models.MarkRequestAsRead(db, requestID, userID.(int)); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark request as read"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Request marked as read"})
	}
}

// MarkAllRequestsAsRead handles POST /api/requests/read-all
func MarkAllRequestsAsRead(db *sql.DB) gin.HandlerFunc {
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

		var entityID int
		roleStr := role.(string)

		if roleStr == "hospital" {
			hospital, err := models.GetHospitalByUserID(db, userID.(int))
			if err != nil || hospital == nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Hospital not found"})
				return
			}
			entityID = hospital.ID
		} else if roleStr == "facility" {
			facility, err := models.GetFacilityByUserID(db, userID.(int))
			if err != nil || facility == nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Facility not found"})
				return
			}
			entityID = facility.ID
		} else {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid role"})
			return
		}

		// Mark all as read
		if err := models.MarkAllRequestsAsRead(db, userID.(int), roleStr, entityID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark requests as read"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "All requests marked as read"})
	}
}
