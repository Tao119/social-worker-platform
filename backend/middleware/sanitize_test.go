package middleware

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSanitizeString(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected string
	}{
		{"normal string", "Hello World", "Hello World"},
		{"with whitespace", "  Hello  ", "Hello"},
		{"with HTML", "<script>alert('xss')</script>", "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"},
		{"with special chars", "Test & Co.", "Test &amp; Co."},
		{"empty string", "", ""},
		{"only whitespace", "   ", ""},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := SanitizeString(tc.input)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestSanitizeEmail(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected string
	}{
		{"valid email", "test@example.com", "test@example.com"},
		{"uppercase email", "Test@Example.COM", "test@example.com"},
		{"with spaces", "  test@example.com  ", "test@example.com"},
		{"invalid format", "notanemail", ""},
		{"missing @", "test.example.com", ""},
		{"missing domain", "test@", ""},
		{"empty string", "", ""},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := SanitizeEmail(tc.input)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestSanitizeSQL(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		contains []string // strings that should NOT be in output
	}{
		{"SQL comment", "test--comment", []string{"--"}},
		{"DROP statement", "DROP TABLE users", []string{"DROP"}},
		{"DELETE statement", "delete from users", []string{"delete"}},
		{"semicolon", "test; DROP TABLE", []string{";"}},
		{"block comment", "test /* comment */", []string{"/*", "*/"}},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := SanitizeSQL(tc.input)
			for _, forbidden := range tc.contains {
				assert.NotContains(t, result, forbidden)
			}
		})
	}
}

func TestValidateStringLength(t *testing.T) {
	testCases := []struct {
		name      string
		input     string
		minLength int
		maxLength int
		expected  bool
	}{
		{"within range", "test", 1, 10, true},
		{"too short", "a", 2, 10, false},
		{"too long", "verylongstring", 1, 5, false},
		{"exact min", "ab", 2, 10, true},
		{"exact max", "12345", 1, 5, true},
		{"empty string", "", 1, 10, false},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := ValidateStringLength(tc.input, tc.minLength, tc.maxLength)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestValidateInteger(t *testing.T) {
	testCases := []struct {
		name     string
		value    int
		min      int
		max      int
		expected bool
	}{
		{"within range", 5, 1, 10, true},
		{"below min", 0, 1, 10, false},
		{"above max", 11, 1, 10, false},
		{"exact min", 1, 1, 10, true},
		{"exact max", 10, 1, 10, true},
		{"negative range", -5, -10, 0, true},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := ValidateInteger(tc.value, tc.min, tc.max)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestRemoveControlCharacters(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected string
	}{
		{"normal string", "Hello", "Hello"},
		{"with newline", "Hello\nWorld", "HelloWorld"},
		{"with tab", "Hello\tWorld", "HelloWorld"},
		{"with null byte", "Hello\x00World", "HelloWorld"},
		{"with multiple control chars", "Test\r\n\t\x00String", "TestString"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := RemoveControlCharacters(tc.input)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestValidatePhoneNumber(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected bool
	}{
		{"valid phone", "123-456-7890", true},
		{"with spaces", "123 456 7890", true},
		{"with parentheses", "(123) 456-7890", true},
		{"international", "+1-123-456-7890", true},
		{"digits only", "1234567890", true},
		{"with letters", "123-ABC-7890", false},
		{"with special chars", "123@456#7890", false},
		{"empty string", "", true}, // Optional field
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := ValidatePhoneNumber(tc.input)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestSanitizeFilename(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		notContains []string
	}{
		{"path traversal", "../../../etc/passwd", []string{".."}},
		{"forward slash", "path/to/file.txt", []string{"/"}},
		{"backslash", "path\\to\\file.txt", []string{"\\"}},
		{"special chars", "file<>:|?.txt", []string{"<", ">", ":", "|", "?"}},
		{"normal filename", "document.pdf", []string{}},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := SanitizeFilename(tc.input)
			for _, forbidden := range tc.notContains {
				assert.NotContains(t, result, forbidden)
			}
		})
	}
}
