package middleware

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: social-worker-platform, Property 5: Role-based access control
// For any protected endpoint and any user, if the user's role does not have permission,
// the request should return an authorization error
func TestProperty_RoleBasedAccessControl(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping property test in short mode")
	}

	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	gin.SetMode(gin.TestMode)

	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100
	properties := gopter.NewProperties(parameters)

	properties.Property("User with correct role can access endpoint", prop.ForAll(
		func(userID int, emailSeed int64, allowedRole string) bool {
			email := fmt.Sprintf("user%d@example.com", emailSeed)

			router := gin.New()
			router.GET("/protected", AuthMiddleware(), RequireRole(allowedRole), func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"message": "success"})
			})

			token, err := GenerateToken(userID, email, allowedRole)
			if err != nil {
				return false
			}

			req, _ := http.NewRequest("GET", "/protected", nil)
			req.Header.Set("Authorization", "Bearer "+token)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			// Should return 200 OK
			return w.Code == http.StatusOK
		},
		gen.IntRange(1, 100000),
		gen.Int64Range(1, 100000),
		gen.OneConstOf("hospital", "facility", "admin"),
	))

	properties.Property("User with incorrect role is denied access", prop.ForAll(
		func(userID int, emailSeed int64, userRole string, requiredRole string) bool {
			if userRole == requiredRole {
				return true // Skip if roles match
			}

			email := fmt.Sprintf("user%d@example.com", emailSeed)

			router := gin.New()
			router.GET("/protected", AuthMiddleware(), RequireRole(requiredRole), func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"message": "success"})
			})

			token, err := GenerateToken(userID, email, userRole)
			if err != nil {
				return false
			}

			req, _ := http.NewRequest("GET", "/protected", nil)
			req.Header.Set("Authorization", "Bearer "+token)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			// Should return 403 Forbidden
			return w.Code == http.StatusForbidden
		},
		gen.IntRange(1, 100000),
		gen.Int64Range(1, 100000),
		gen.OneConstOf("hospital", "facility", "admin"),
		gen.OneConstOf("hospital", "facility", "admin"),
	))

	properties.Property("User with one of multiple allowed roles can access", prop.ForAll(
		func(userID int, emailSeed int64, userRole string) bool {
			email := fmt.Sprintf("user%d@example.com", emailSeed)

			router := gin.New()
			router.GET("/protected", AuthMiddleware(), RequireRole("hospital", "facility"), func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"message": "success"})
			})

			token, err := GenerateToken(userID, email, userRole)
			if err != nil {
				return false
			}

			req, _ := http.NewRequest("GET", "/protected", nil)
			req.Header.Set("Authorization", "Bearer "+token)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			// Should return 200 OK if role is hospital or facility, 403 if admin
			if userRole == "hospital" || userRole == "facility" {
				return w.Code == http.StatusOK
			}
			return w.Code == http.StatusForbidden
		},
		gen.IntRange(1, 100000),
		gen.Int64Range(1, 100000),
		gen.OneConstOf("hospital", "facility", "admin"),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Feature: social-worker-platform, Property 6: Expired sessions require re-authentication
// For any expired session token, requests using that token should fail with an authentication error
func TestProperty_ExpiredSessionsRequireReAuthentication(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping property test in short mode")
	}

	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	gin.SetMode(gin.TestMode)

	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100
	properties := gopter.NewProperties(parameters)

	properties.Property("Expired token is rejected by middleware", prop.ForAll(
		func(userID int, emailSeed int64, role string) bool {
			email := fmt.Sprintf("user%d@example.com", emailSeed)

			router := gin.New()
			router.GET("/protected", AuthMiddleware(), func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"message": "success"})
			})

			// Create expired token
			expirationTime := time.Now().Add(-1 * time.Hour)
			claims := &Claims{
				UserID: userID,
				Email:  email,
				Role:   role,
				RegisteredClaims: jwt.RegisteredClaims{
					ExpiresAt: jwt.NewNumericDate(expirationTime),
					IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
				},
			}

			secret, _ := getJWTSecret()
			token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
			expiredToken, err := token.SignedString([]byte(secret))
			if err != nil {
				return false
			}

			req, _ := http.NewRequest("GET", "/protected", nil)
			req.Header.Set("Authorization", "Bearer "+expiredToken)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			// Should return 401 Unauthorized
			return w.Code == http.StatusUnauthorized
		},
		gen.IntRange(1, 100000),
		gen.Int64Range(1, 100000),
		gen.OneConstOf("hospital", "facility", "admin"),
	))

	properties.Property("Valid non-expired token is accepted", prop.ForAll(
		func(userID int, emailSeed int64, role string) bool {
			email := fmt.Sprintf("user%d@example.com", emailSeed)

			router := gin.New()
			router.GET("/protected", AuthMiddleware(), func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"message": "success"})
			})

			token, err := GenerateToken(userID, email, role)
			if err != nil {
				return false
			}

			req, _ := http.NewRequest("GET", "/protected", nil)
			req.Header.Set("Authorization", "Bearer "+token)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			// Should return 200 OK
			return w.Code == http.StatusOK
		},
		gen.IntRange(1, 100000),
		gen.Int64Range(1, 100000),
		gen.OneConstOf("hospital", "facility", "admin"),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}
