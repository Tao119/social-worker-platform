package middleware

import (
	"fmt"
	"os"
	"testing"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: social-worker-platform, Property 32: Passwords are encrypted
// For any user account, the password stored in the database should be hashed (not plain text)
func TestProperty_PasswordsAreEncrypted(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping property test in short mode")
	}

	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100
	properties := gopter.NewProperties(parameters)

	properties.Property("Hashed password is never equal to plain password", prop.ForAll(
		func(seed int64) bool {
			password := fmt.Sprintf("password%d", seed)

			hashed, err := HashPassword(password)
			if err != nil {
				t.Logf("HashPassword error: %v", err)
				return false
			}

			// Hashed password should never equal the plain password
			return hashed != password
		},
		gen.Int64(),
	))

	properties.Property("Hashed password can be verified", prop.ForAll(
		func(seed int64) bool {
			password := fmt.Sprintf("password%d", seed)

			hashed, err := HashPassword(password)
			if err != nil {
				t.Logf("HashPassword error: %v", err)
				return false
			}

			// Should be able to verify the correct password
			return VerifyPassword(hashed, password)
		},
		gen.Int64(),
	))

	properties.Property("Wrong password fails verification", prop.ForAll(
		func(seed1, seed2 int64) bool {
			if seed1 == seed2 {
				return true // Skip if seeds are the same
			}

			password := fmt.Sprintf("password%d", seed1)
			wrongPassword := fmt.Sprintf("password%d", seed2)

			hashed, err := HashPassword(password)
			if err != nil {
				t.Logf("HashPassword error: %v", err)
				return false
			}

			// Wrong password should fail verification
			return !VerifyPassword(hashed, wrongPassword)
		},
		gen.Int64(),
		gen.Int64(),
	))

	properties.Property("Same password produces different hashes", prop.ForAll(
		func(seed int64) bool {
			password := fmt.Sprintf("password%d", seed)

			hash1, err1 := HashPassword(password)
			hash2, err2 := HashPassword(password)

			if err1 != nil || err2 != nil {
				t.Logf("HashPassword errors: %v, %v", err1, err2)
				return false
			}

			// bcrypt includes salt, so same password should produce different hashes
			return hash1 != hash2
		},
		gen.Int64(),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Feature: social-worker-platform, Property 33: Session tokens are secure
// For any generated session token, it should be a valid JWT with proper signature and expiration
func TestProperty_SessionTokensAreSecure(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping property test in short mode")
	}

	// Set JWT_SECRET for tests
	os.Setenv("JWT_SECRET", "test-secret-for-property-tests")
	defer os.Unsetenv("JWT_SECRET")

	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100
	properties := gopter.NewProperties(parameters)

	properties.Property("Generated token is valid JWT", prop.ForAll(
		func(userID int, emailSeed int64, role string) bool {
			email := fmt.Sprintf("user%d@example.com", emailSeed)
			token, err := GenerateToken(userID, email, role)
			if err != nil {
				t.Logf("GenerateToken error: %v", err)
				return false
			}

			// Token should not be empty
			if token == "" {
				t.Log("Token is empty")
				return false
			}

			// Token should be validatable
			claims, err := ValidateToken(token)
			if err != nil {
				t.Logf("ValidateToken error: %v", err)
				return false
			}

			// Claims should match input
			return claims.UserID == userID &&
				claims.Email == email &&
				claims.Role == role
		},
		gen.Int(),
		gen.Int64(),
		gen.OneConstOf("hospital", "facility", "admin"),
	))

	properties.Property("Token has expiration", prop.ForAll(
		func(userID int, emailSeed int64, role string) bool {
			email := fmt.Sprintf("user%d@example.com", emailSeed)
			token, err := GenerateToken(userID, email, role)
			if err != nil {
				t.Logf("GenerateToken error: %v", err)
				return false
			}

			claims, err := ValidateToken(token)
			if err != nil {
				t.Logf("ValidateToken error: %v", err)
				return false
			}

			// Token should have expiration in the future
			return claims.ExpiresAt != nil && claims.ExpiresAt.Unix() > 0
		},
		gen.Int(),
		gen.Int64(),
		gen.OneConstOf("hospital", "facility", "admin"),
	))

	properties.Property("Token with wrong secret fails validation", prop.ForAll(
		func(userID int, emailSeed int64, role string) bool {
			email := fmt.Sprintf("user%d@example.com", emailSeed)

			// Generate token with one secret
			os.Setenv("JWT_SECRET", "secret1")
			token, err := GenerateToken(userID, email, role)
			if err != nil {
				t.Logf("GenerateToken error: %v", err)
				return false
			}

			// Try to validate with different secret
			os.Setenv("JWT_SECRET", "secret2")
			_, err = ValidateToken(token)

			// Reset secret
			os.Setenv("JWT_SECRET", "test-secret-for-property-tests")

			// Validation should fail
			return err != nil
		},
		gen.Int(),
		gen.Int64(),
		gen.OneConstOf("hospital", "facility", "admin"),
	))

	properties.Property("Token refresh preserves user identity", prop.ForAll(
		func(userID int, emailSeed int64, role string) bool {
			email := fmt.Sprintf("user%d@example.com", emailSeed)

			originalToken, err := GenerateToken(userID, email, role)
			if err != nil {
				t.Logf("GenerateToken error: %v", err)
				return false
			}

			refreshedToken, err := RefreshToken(originalToken)
			if err != nil {
				t.Logf("RefreshToken error: %v", err)
				return false
			}

			// Validate refreshed token
			claims, err := ValidateToken(refreshedToken)
			if err != nil {
				t.Logf("ValidateToken error: %v", err)
				return false
			}

			// User identity should be preserved
			return claims.UserID == userID &&
				claims.Email == email &&
				claims.Role == role
		},
		gen.Int(),
		gen.Int64(),
		gen.OneConstOf("hospital", "facility", "admin"),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}
