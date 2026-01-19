package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/social-worker-platform/backend/models"
)

type DocumentHandler struct {
	documentRepo *models.DocumentRepository
	uploadDir    string
}

func NewDocumentHandler(documentRepo *models.DocumentRepository) *DocumentHandler {
	uploadDir := getEnv("UPLOAD_DIR", "./uploads")
	os.MkdirAll(uploadDir, 0755)

	return &DocumentHandler{
		documentRepo: documentRepo,
		uploadDir:    uploadDir,
	}
}

type CreateDocumentRequest struct {
	RecipientID  int    `form:"recipient_id" binding:"required"`
	Title        string `form:"title" binding:"required"`
	DocumentType string `form:"document_type"`
}

func (h *DocumentHandler) Upload(c *gin.Context) {
	senderID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req CreateDocumentRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}

	// Generate unique filename
	timestamp := time.Now().Unix()
	filename := fmt.Sprintf("%d_%s", timestamp, filepath.Base(file.Filename))
	filePath := filepath.Join(h.uploadDir, filename)

	// Save file
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Create document record
	document, err := h.documentRepo.Create(
		senderID.(int),
		req.RecipientID,
		req.Title,
		filePath,
		req.DocumentType,
	)
	if err != nil {
		os.Remove(filePath) // Clean up file if database insert fails
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create document record"})
		return
	}

	c.JSON(http.StatusCreated, document)
}

func (h *DocumentHandler) List(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	documents, err := h.documentRepo.GetByUserID(userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve documents"})
		return
	}

	c.JSON(http.StatusOK, documents)
}

func (h *DocumentHandler) GetByID(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document ID"})
		return
	}

	document, err := h.documentRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
		return
	}

	// Check if user has access to this document
	if document.SenderID != userID.(int) && document.RecipientID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to access this document"})
		return
	}

	c.JSON(http.StatusOK, document)
}

func (h *DocumentHandler) Download(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document ID"})
		return
	}

	document, err := h.documentRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
		return
	}

	// Check if user has access to this document
	if document.SenderID != userID.(int) && document.RecipientID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to access this document"})
		return
	}

	// Open file
	file, err := os.Open(document.FilePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
		return
	}
	defer file.Close()

	// Get file info
	fileInfo, err := file.Stat()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get file info"})
		return
	}

	// Set headers
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filepath.Base(document.FilePath)))
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Length", fmt.Sprintf("%d", fileInfo.Size()))

	// Stream file
	io.Copy(c.Writer, file)
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
