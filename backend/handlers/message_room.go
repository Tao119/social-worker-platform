package handlers

import (
	"database/sql"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/social-worker-platform/backend/models"
)

// GetMessageRooms handles GET /api/rooms
func GetMessageRooms(db *sql.DB) gin.HandlerFunc {
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

		var rooms []*models.MessageRoom
		var err error

		if role == "hospital" {
			hospital, err := models.GetHospitalByUserID(db, userID.(int))
			if err != nil || hospital == nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Hospital not found"})
				return
			}
			rooms, err = models.GetMessageRoomsByHospitalID(db, hospital.ID)
		} else if role == "facility" {
			facility, err := models.GetFacilityByUserID(db, userID.(int))
			if err != nil || facility == nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Facility not found"})
				return
			}
			rooms, err = models.GetMessageRoomsByFacilityID(db, facility.ID)
		} else {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid role"})
			return
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve rooms"})
			return
		}

		if rooms == nil {
			rooms = []*models.MessageRoom{}
		}

		c.JSON(http.StatusOK, rooms)
	}
}

// GetMessageRoomByID handles GET /api/rooms/:id
func GetMessageRoomByID(db *sql.DB) gin.HandlerFunc {
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
		if role == "hospital" {
			hospital, err := models.GetHospitalByUserID(db, userID.(int))
			if err != nil || hospital == nil || hospital.ID != room.HospitalID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
				return
			}
		} else if role == "facility" {
			facility, err := models.GetFacilityByUserID(db, userID.(int))
			if err != nil || facility == nil || facility.ID != room.FacilityID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
				return
			}
		} else {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid role"})
			return
		}

		// Get messages
		messages, err := models.GetMessagesByRoomID(db, roomID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve messages"})
			return
		}

		// Get files
		files, err := models.GetRoomFilesByRoomID(db, roomID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve files"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"room":     room,
			"messages": messages,
			"files":    files,
		})
	}
}

// SendMessage handles POST /api/rooms/:id/messages
func SendMessage(db *sql.DB) gin.HandlerFunc {
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

		room, err := models.GetMessageRoomByID(db, roomID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve room"})
			return
		}

		if room == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
			return
		}

		// Check if room is closed (only rejected blocks messages, completed allows follow-up)
		if room.Status == "rejected" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Room is closed"})
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

		var req struct {
			MessageText string `json:"message_text" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		message := &models.Message{
			RoomID:      roomID,
			SenderID:    userID.(int),
			MessageText: req.MessageText,
		}

		if err := models.CreateMessage(db, message); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
			return
		}

		c.JSON(http.StatusCreated, message)
	}
}

// UploadRoomFile handles POST /api/rooms/:id/files
func UploadRoomFile(db *sql.DB) gin.HandlerFunc {
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

		room, err := models.GetMessageRoomByID(db, roomID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve room"})
			return
		}

		if room == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
			return
		}

		// Check if room is closed
		if room.Status == "rejected" || room.Status == "completed" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Room is closed"})
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

		// Get file from request
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
			return
		}

		// Create uploads directory if it doesn't exist
		uploadDir := "./uploads/rooms"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// Generate unique filename
		timestamp := time.Now().Unix()
		filename := filepath.Base(file.Filename)
		savePath := filepath.Join(uploadDir, strconv.FormatInt(timestamp, 10)+"_"+filename)

		// Save file
		if err := c.SaveUploadedFile(file, savePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		// Create room file record
		roomFile := &models.RoomFile{
			RoomID:   roomID,
			SenderID: userID.(int),
			FileName: filename,
			FilePath: savePath,
			FileType: filepath.Ext(filename),
			FileSize: file.Size,
		}

		if err := models.CreateRoomFile(db, roomFile); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create file record"})
			return
		}

		c.JSON(http.StatusCreated, roomFile)
	}
}

// DownloadRoomFile handles GET /api/rooms/:id/files/:fileId
func DownloadRoomFile(db *sql.DB) gin.HandlerFunc {
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
		fileID, err := strconv.Atoi(c.Param("fileId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
			return
		}

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

		// Get file record
		file, err := models.GetRoomFileByID(db, fileID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve file"})
			return
		}

		if file == nil || file.RoomID != roomID {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
			return
		}

		// Open file
		f, err := os.Open(file.FilePath)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found on disk"})
			return
		}
		defer f.Close()

		// Set headers
		c.Header("Content-Description", "File Transfer")
		c.Header("Content-Transfer-Encoding", "binary")
		c.Header("Content-Disposition", "attachment; filename="+file.FileName)
		c.Header("Content-Type", "application/octet-stream")

		// Stream file
		io.Copy(c.Writer, f)
	}
}

// DeleteRoomFile handles DELETE /api/rooms/:id/files/:fileId
func DeleteRoomFile(db *sql.DB) gin.HandlerFunc {
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
		fileID, err := strconv.Atoi(c.Param("fileId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
			return
		}

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

		// Get file record
		file, err := models.GetRoomFileByID(db, fileID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve file"})
			return
		}

		if file == nil || file.RoomID != roomID {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
			return
		}

		// Check if user is the sender
		if file.SenderID != userID.(int) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own files"})
			return
		}

		// Delete file from filesystem
		if err := os.Remove(file.FilePath); err != nil && !os.IsNotExist(err) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file from disk"})
			return
		}

		// Delete file record from database
		if err := models.DeleteRoomFile(db, fileID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file record"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "File deleted successfully"})
	}
}

// AcceptRoom handles POST /api/rooms/:id/accept (facility accepts the placement)
func AcceptRoom(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		role, exists := c.Get("userRole")
		if !exists || role != "facility" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only facility users can accept placement"})
			return
		}

		roomID := c.Param("id")

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
		facility, err := models.GetFacilityByUserID(db, userID.(int))
		if err != nil || facility == nil || facility.ID != room.FacilityID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}

		// Can only accept from negotiating status
		if room.Status != "negotiating" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Room is not in negotiating status"})
			return
		}

		// Update status to accepted (still active for document exchange)
		if err := models.UpdateMessageRoomStatus(db, roomID, "accepted"); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to accept room"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Placement accepted"})
	}
}

// RejectRoom handles POST /api/rooms/:id/reject (facility rejects the placement)
func RejectRoom(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		role, exists := c.Get("userRole")
		if !exists || role != "facility" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only facility users can reject placement"})
			return
		}

		roomID := c.Param("id")

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
		facility, err := models.GetFacilityByUserID(db, userID.(int))
		if err != nil || facility == nil || facility.ID != room.FacilityID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}

		// Can only reject from negotiating status
		if room.Status != "negotiating" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Room is not in negotiating status"})
			return
		}

		// Update status to rejected (inactive)
		if err := models.UpdateMessageRoomStatus(db, roomID, "rejected"); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject room"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Placement rejected"})
	}
}

// CompleteRoom handles POST /api/rooms/:id/complete
func CompleteRoom(db *sql.DB) gin.HandlerFunc {
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

		room, err := models.GetMessageRoomByID(db, roomID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve room"})
			return
		}

		if room == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
			return
		}

		// Can only complete from accepted status
		if room.Status != "accepted" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Room must be accepted before completion"})
			return
		}

		// Update completion flag based on role
		if role == "hospital" {
			hospital, err := models.GetHospitalByUserID(db, userID.(int))
			if err != nil || hospital == nil || hospital.ID != room.HospitalID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
				return
			}

			if err := models.UpdateHospitalCompletion(db, roomID, true); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark as complete"})
				return
			}

			// Check if both parties completed
			room, _ = models.GetMessageRoomByID(db, roomID)
			if room.FacilityCompleted {
				// Both completed, close the room
				models.UpdateMessageRoomStatus(db, roomID, "completed")
			}

		} else if role == "facility" {
			facility, err := models.GetFacilityByUserID(db, userID.(int))
			if err != nil || facility == nil || facility.ID != room.FacilityID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
				return
			}

			if err := models.UpdateFacilityCompletion(db, roomID, true); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark as complete"})
				return
			}

			// Check if both parties completed
			room, _ = models.GetMessageRoomByID(db, roomID)
			if room.HospitalCompleted {
				// Both completed, close the room
				models.UpdateMessageRoomStatus(db, roomID, "completed")
			}

		} else {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid role"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Marked as complete"})
	}
}

// CancelCompletion handles POST /api/rooms/:id/cancel-completion
func CancelCompletion(db *sql.DB) gin.HandlerFunc {
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

		room, err := models.GetMessageRoomByID(db, roomID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve room"})
			return
		}

		if room == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
			return
		}

		// Can only cancel if room is still accepted (not completed)
		if room.Status != "accepted" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot cancel completion for this room"})
			return
		}

		// Update completion flag based on role
		if role == "hospital" {
			hospital, err := models.GetHospitalByUserID(db, userID.(int))
			if err != nil || hospital == nil || hospital.ID != room.HospitalID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
				return
			}

			if err := models.UpdateHospitalCompletion(db, roomID, false); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel completion"})
				return
			}

		} else if role == "facility" {
			facility, err := models.GetFacilityByUserID(db, userID.(int))
			if err != nil || facility == nil || facility.ID != room.FacilityID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
				return
			}

			if err := models.UpdateFacilityCompletion(db, roomID, false); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel completion"})
				return
			}

		} else {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid role"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Completion cancelled"})
	}
}
