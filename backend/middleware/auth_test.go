package middleware

import (
	"os"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
)

func TestHashPassword(t *testing.T) {
	// Set JWT_SECRET for all tests
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	t.Run("successfully hashes password", func(t *testing.T) {
		password := "testpassword123"
		hashed, err := HashPassword(password)

		assert.NoError(t, err)
		assert.NotEmpty(t, hashed)
		assert.NotEqual(t, password, hashed)
	})

	t.Run("generates different hashes for same password", func(t *testing.T) {
		password := "testpassword123"
		hash1, err1 := HashPassword(password)
		hash2, err2 := HashPassword(password)

		assert.NoError(t, err1)
		assert.NoError(t, err2)
		assert.NotEqual(t, hash1, hash2) // bcrypt includes salt
	})
}

func TestVerifyPassword(t *testing.T) {
	// Set JWT_SECRET for all tests
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	t.Run("verifies correct password", func(t *testing.T) {
		password := "correctpassword"
		hashed, _ := HashPassword(password)

		result := VerifyPassword(hashed, password)
		assert.True(t, result)
	})

	t.Run("rejects incorrect password", func(t *testing.T) {
		password := "correctpassword"
		hashed, _ := HashPassword(password)

		result := VerifyPassword(hashed, "wrongpassword")
		assert.False(t, result)
	})

	t.Run("rejects empty password", func(t *testing.T) {
		password := "correctpassword"
		hashed, _ := HashPassword(password)

		result := VerifyPassword(hashed, "")
		assert.False(t, result)
	})
}

func TestGenerateToken(t *testing.T) {
	// Set JWT_SECRET for all tests
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	t.Run("generates valid token", func(t *testing.T) {
		userID := 123
		email := "test@example.com"
		role := "hospital"

		token, err := GenerateToken(userID, email, role)

		assert.NoError(t, err)
		assert.NotEmpty(t, token)
	})

	t.Run("token contains correct claims", func(t *testing.T) {
		userID := 456
		email := "facility@example.com"
		role := "facility"

		tokenString, err := GenerateToken(userID, email, role)
		assert.NoError(t, err)

		claims, err := ValidateToken(tokenString)
		assert.NoError(t, err)
		assert.Equal(t, userID, claims.UserID)
		assert.Equal(t, email, claims.Email)
		assert.Equal(t, role, claims.Role)
	})

	t.Run("token has expiration time", func(t *testing.T) {
		tokenString, err := GenerateToken(1, "test@example.com", "admin")
		assert.NoError(t, err)

		claims, err := ValidateToken(tokenString)
		assert.NoError(t, err)
		assert.True(t, claims.ExpiresAt.After(time.Now()))
	})

	t.Run("fails when JWT_SECRET is not set", func(t *testing.T) {
		os.Unsetenv("JWT_SECRET")
		defer os.Setenv("JWT_SECRET", "test-secret-key")

		token, err := GenerateToken(1, "test@example.com", "admin")
		assert.Error(t, err)
		assert.Empty(t, token)
		assert.Contains(t, err.Error(), "JWT_SECRET")
	})
}

func TestValidateToken(t *testing.T) {
	// Set JWT_SECRET for all tests
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	t.Run("validates correct token", func(t *testing.T) {
		tokenString, _ := GenerateToken(1, "test@example.com", "hospital")

		claims, err := ValidateToken(tokenString)

		assert.NoError(t, err)
		assert.NotNil(t, claims)
		assert.Equal(t, 1, claims.UserID)
	})

	t.Run("rejects empty token", func(t *testing.T) {
		claims, err := ValidateToken("")

		assert.Error(t, err)
		assert.Nil(t, claims)
		assert.Equal(t, ErrTokenNotFound, err)
	})

	t.Run("rejects invalid token format", func(t *testing.T) {
		claims, err := ValidateToken("invalid.token.format")

		assert.Error(t, err)
		assert.Nil(t, claims)
	})

	t.Run("rejects token with wrong signature", func(t *testing.T) {
		// Generate token with one secret
		os.Setenv("JWT_SECRET", "secret1")
		tokenString, _ := GenerateToken(1, "test@example.com", "hospital")

		// Try to validate with different secret
		os.Setenv("JWT_SECRET", "secret2")
		claims, err := ValidateToken(tokenString)

		assert.Error(t, err)
		assert.Nil(t, claims)

		// Reset
		os.Unsetenv("JWT_SECRET")
	})

	t.Run("rejects expired token", func(t *testing.T) {
		// Create token with past expiration
		expirationTime := time.Now().Add(-1 * time.Hour)
		claims := &Claims{
			UserID: 1,
			Email:  "test@example.com",
			Role:   "hospital",
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(expirationTime),
				IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			},
		}

		// Need to set JWT_SECRET before getting it
		os.Setenv("JWT_SECRET", "test-secret-key")
		secret, _ := getJWTSecret()
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenString, _ := token.SignedString([]byte(secret))

		validatedClaims, err := ValidateToken(tokenString)

		assert.Error(t, err)
		assert.Nil(t, validatedClaims)
		assert.Equal(t, ErrExpiredToken, err)
	})

	t.Run("fails when JWT_SECRET is not set", func(t *testing.T) {
		os.Unsetenv("JWT_SECRET")
		defer os.Setenv("JWT_SECRET", "test-secret-key")

		claims, err := ValidateToken("any.token.string")
		assert.Error(t, err)
		assert.Nil(t, claims)
		assert.Contains(t, err.Error(), "JWT_SECRET")
	})
}

func TestRefreshToken(t *testing.T) {
	// Set JWT_SECRET for all tests
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	t.Run("refreshes valid token", func(t *testing.T) {
		originalToken, _ := GenerateToken(1, "test@example.com", "hospital")
		time.Sleep(1 * time.Second) // Ensure different timestamp

		newToken, err := RefreshToken(originalToken)

		assert.NoError(t, err)
		assert.NotEmpty(t, newToken)
		assert.NotEqual(t, originalToken, newToken)
	})

	t.Run("refreshes expired token", func(t *testing.T) {
		// Create expired token
		expirationTime := time.Now().Add(-1 * time.Hour)
		claims := &Claims{
			UserID: 1,
			Email:  "test@example.com",
			Role:   "hospital",
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(expirationTime),
				IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			},
		}

		secret, _ := getJWTSecret()
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		expiredToken, _ := token.SignedString([]byte(secret))

		newToken, err := RefreshToken(expiredToken)

		assert.NoError(t, err)
		assert.NotEmpty(t, newToken)

		// Verify new token is valid
		newClaims, err := ValidateToken(newToken)
		assert.NoError(t, err)
		assert.Equal(t, 1, newClaims.UserID)
	})

	t.Run("rejects invalid token", func(t *testing.T) {
		newToken, err := RefreshToken("invalid.token")

		assert.Error(t, err)
		assert.Empty(t, newToken)
	})
}

// TestInvalidTokenFormats tests various invalid token formats
func TestInvalidTokenFormats(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	testCases := []struct {
		name  string
		token string
	}{
		{"empty string", ""},
		{"single part", "invalidtoken"},
		{"two parts", "invalid.token"},
		{"malformed JWT", "not.a.jwt.token"},
		{"random string", "randomstringnotjwt"},
		{"special characters", "!@#$%^&*()"},
		{"SQL injection attempt", "'; DROP TABLE users; --"},
		{"XSS attempt", "<script>alert('xss')</script>"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			claims, err := ValidateToken(tc.token)
			assert.Error(t, err, "Should reject invalid token format: %s", tc.name)
			assert.Nil(t, claims, "Claims should be nil for invalid token")
		})
	}
}

// TestTokenWithInvalidClaims tests tokens with invalid or missing claims
func TestTokenWithInvalidClaims(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	secret, _ := getJWTSecret()

	t.Run("token with missing user ID", func(t *testing.T) {
		claims := &Claims{
			Email: "test@example.com",
			Role:  "hospital",
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			},
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenString, _ := token.SignedString([]byte(secret))

		validatedClaims, err := ValidateToken(tokenString)
		// Token is technically valid, but UserID is 0
		assert.NoError(t, err)
		assert.Equal(t, 0, validatedClaims.UserID)
	})

	t.Run("token with missing email", func(t *testing.T) {
		claims := &Claims{
			UserID: 1,
			Role:   "hospital",
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			},
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenString, _ := token.SignedString([]byte(secret))

		validatedClaims, err := ValidateToken(tokenString)
		assert.NoError(t, err)
		assert.Empty(t, validatedClaims.Email)
	})

	t.Run("token with missing role", func(t *testing.T) {
		claims := &Claims{
			UserID: 1,
			Email:  "test@example.com",
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			},
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenString, _ := token.SignedString([]byte(secret))

		validatedClaims, err := ValidateToken(tokenString)
		assert.NoError(t, err)
		assert.Empty(t, validatedClaims.Role)
	})
}

// TestTokenWithDifferentSigningMethods tests tokens signed with different algorithms
func TestTokenWithDifferentSigningMethods(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	secret, _ := getJWTSecret()

	t.Run("token with HS512 algorithm", func(t *testing.T) {
		claims := &Claims{
			UserID: 1,
			Email:  "test@example.com",
			Role:   "hospital",
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			},
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS512, claims)
		tokenString, _ := token.SignedString([]byte(secret))

		// ValidateToken accepts any HMAC signing method (HS256, HS512, etc.)
		validatedClaims, err := ValidateToken(tokenString)
		assert.NoError(t, err)
		assert.NotNil(t, validatedClaims)
		assert.Equal(t, claims.UserID, validatedClaims.UserID)
	})

	t.Run("token with none algorithm", func(t *testing.T) {
		claims := &Claims{
			UserID: 1,
			Email:  "test@example.com",
			Role:   "hospital",
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			},
		}
		token := jwt.NewWithClaims(jwt.SigningMethodNone, claims)
		tokenString, _ := token.SignedString(jwt.UnsafeAllowNoneSignatureType)

		// Should fail because we don't allow 'none' algorithm
		validatedClaims, err := ValidateToken(tokenString)
		assert.Error(t, err)
		assert.Nil(t, validatedClaims)
	})
}

// TestPasswordEdgeCases tests password hashing with edge cases
func TestPasswordEdgeCases(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	t.Run("very long password", func(t *testing.T) {
		// bcrypt has a maximum password length of 72 bytes
		longPassword := string(make([]byte, 100))
		for i := range longPassword {
			longPassword = longPassword[:i] + "a" + longPassword[i+1:]
		}

		hashed, err := HashPassword(longPassword)
		// bcrypt will fail for passwords longer than 72 bytes
		if len(longPassword) > 72 {
			assert.Error(t, err)
			return
		}
		assert.NoError(t, err)
		assert.NotEmpty(t, hashed)

		result := VerifyPassword(hashed, longPassword)
		assert.True(t, result)
	})

	t.Run("password with special characters", func(t *testing.T) {
		specialPassword := "!@#$%^&*()_+-=[]{}|;':\",./<>?"
		hashed, err := HashPassword(specialPassword)
		assert.NoError(t, err)

		result := VerifyPassword(hashed, specialPassword)
		assert.True(t, result)
	})

	t.Run("password with unicode characters", func(t *testing.T) {
		unicodePassword := "パスワード123🔒"
		hashed, err := HashPassword(unicodePassword)
		assert.NoError(t, err)

		result := VerifyPassword(hashed, unicodePassword)
		assert.True(t, result)
	})

	t.Run("empty password hash", func(t *testing.T) {
		result := VerifyPassword("", "anypassword")
		assert.False(t, result)
	})

	t.Run("invalid hash format", func(t *testing.T) {
		result := VerifyPassword("not-a-valid-bcrypt-hash", "password")
		assert.False(t, result)
	})
}

// TestConcurrentTokenOperations tests thread safety of token operations
func TestConcurrentTokenOperations(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	t.Run("concurrent token generation", func(t *testing.T) {
		done := make(chan bool, 100)
		for i := 0; i < 100; i++ {
			go func(id int) {
				token, err := GenerateToken(id, "test@example.com", "hospital")
				assert.NoError(t, err)
				assert.NotEmpty(t, token)
				done <- true
			}(i)
		}

		for i := 0; i < 100; i++ {
			<-done
		}
	})

	t.Run("concurrent token validation", func(t *testing.T) {
		token, _ := GenerateToken(1, "test@example.com", "hospital")

		done := make(chan bool, 100)
		for i := 0; i < 100; i++ {
			go func() {
				claims, err := ValidateToken(token)
				assert.NoError(t, err)
				assert.NotNil(t, claims)
				done <- true
			}()
		}

		for i := 0; i < 100; i++ {
			<-done
		}
	})
}
