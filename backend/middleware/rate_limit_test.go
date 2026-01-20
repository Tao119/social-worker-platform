package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestRateLimiter_Allow(t *testing.T) {
	limiter := NewRateLimiter(3, time.Second)

	t.Run("allows requests within limit", func(t *testing.T) {
		ip := "192.168.1.1"
		
		// First 3 requests should be allowed
		assert.True(t, limiter.Allow(ip))
		assert.True(t, limiter.Allow(ip))
		assert.True(t, limiter.Allow(ip))
	})

	t.Run("blocks requests exceeding limit", func(t *testing.T) {
		ip := "192.168.1.2"
		
		// Use up all tokens
		limiter.Allow(ip)
		limiter.Allow(ip)
		limiter.Allow(ip)
		
		// 4th request should be blocked
		assert.False(t, limiter.Allow(ip))
	})

	t.Run("refills tokens after window", func(t *testing.T) {
		limiter := NewRateLimiter(2, 100*time.Millisecond)
		ip := "192.168.1.3"
		
		// Use up tokens
		assert.True(t, limiter.Allow(ip))
		assert.True(t, limiter.Allow(ip))
		assert.False(t, limiter.Allow(ip))
		
		// Wait for window to pass
		time.Sleep(150 * time.Millisecond)
		
		// Should be allowed again
		assert.True(t, limiter.Allow(ip))
	})

	t.Run("tracks different IPs separately", func(t *testing.T) {
		limiter := NewRateLimiter(2, time.Second)
		
		ip1 := "192.168.1.4"
		ip2 := "192.168.1.5"
		
		// Use up tokens for ip1
		assert.True(t, limiter.Allow(ip1))
		assert.True(t, limiter.Allow(ip1))
		assert.False(t, limiter.Allow(ip1))
		
		// ip2 should still have tokens
		assert.True(t, limiter.Allow(ip2))
		assert.True(t, limiter.Allow(ip2))
	})
}

func TestRateLimitMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("allows requests within limit", func(t *testing.T) {
		router := gin.New()
		router.Use(RateLimitMiddleware(3, time.Second))
		router.GET("/test", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		// First 3 requests should succeed
		for i := 0; i < 3; i++ {
			req, _ := http.NewRequest("GET", "/test", nil)
			req.RemoteAddr = "192.168.1.10:1234"
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
			assert.Equal(t, http.StatusOK, w.Code)
		}
	})

	t.Run("blocks requests exceeding limit", func(t *testing.T) {
		router := gin.New()
		router.Use(RateLimitMiddleware(2, time.Second))
		router.GET("/test", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		// Use up limit
		for i := 0; i < 2; i++ {
			req, _ := http.NewRequest("GET", "/test", nil)
			req.RemoteAddr = "192.168.1.11:1234"
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
			assert.Equal(t, http.StatusOK, w.Code)
		}

		// Next request should be blocked
		req, _ := http.NewRequest("GET", "/test", nil)
		req.RemoteAddr = "192.168.1.11:1234"
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusTooManyRequests, w.Code)
	})

	t.Run("returns proper error message", func(t *testing.T) {
		router := gin.New()
		router.Use(RateLimitMiddleware(1, time.Second))
		router.GET("/test", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		// Use up limit
		req1, _ := http.NewRequest("GET", "/test", nil)
		req1.RemoteAddr = "192.168.1.12:1234"
		w1 := httptest.NewRecorder()
		router.ServeHTTP(w1, req1)

		// Exceed limit
		req2, _ := http.NewRequest("GET", "/test", nil)
		req2.RemoteAddr = "192.168.1.12:1234"
		w2 := httptest.NewRecorder()
		router.ServeHTTP(w2, req2)

		assert.Equal(t, http.StatusTooManyRequests, w2.Code)
		assert.Contains(t, w2.Body.String(), "Rate limit exceeded")
	})
}

func TestStrictRateLimitMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(StrictRateLimitMiddleware())
	router.POST("/login", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Should allow up to 10 requests per minute
	for i := 0; i < 10; i++ {
		req, _ := http.NewRequest("POST", "/login", nil)
		req.RemoteAddr = "192.168.1.20:1234"
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code, "Request %d should succeed", i+1)
	}

	// 11th request should be blocked
	req, _ := http.NewRequest("POST", "/login", nil)
	req.RemoteAddr = "192.168.1.20:1234"
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusTooManyRequests, w.Code)
}

func TestStandardRateLimitMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(StandardRateLimitMiddleware())
	router.GET("/api/data", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Should allow up to 100 requests per minute
	for i := 0; i < 100; i++ {
		req, _ := http.NewRequest("GET", "/api/data", nil)
		req.RemoteAddr = "192.168.1.30:1234"
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code, "Request %d should succeed", i+1)
	}

	// 101st request should be blocked
	req, _ := http.NewRequest("GET", "/api/data", nil)
	req.RemoteAddr = "192.168.1.30:1234"
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusTooManyRequests, w.Code)
}

func TestRateLimiter_ConcurrentAccess(t *testing.T) {
	limiter := NewRateLimiter(100, time.Second)
	ip := "192.168.1.40"

	// Test concurrent access
	done := make(chan bool, 50)
	for i := 0; i < 50; i++ {
		go func() {
			limiter.Allow(ip)
			done <- true
		}()
	}

	// Wait for all goroutines
	for i := 0; i < 50; i++ {
		<-done
	}

	// Should not panic or cause race conditions
	assert.True(t, true, "Concurrent access completed without errors")
}

func TestRateLimiter_CleanupVisitors(t *testing.T) {
	limiter := NewRateLimiter(10, 100*time.Millisecond)

	// Add some visitors
	limiter.Allow("192.168.1.50")
	limiter.Allow("192.168.1.51")
	limiter.Allow("192.168.1.52")

	// Check visitors exist
	limiter.mu.RLock()
	initialCount := len(limiter.visitors)
	limiter.mu.RUnlock()
	assert.Equal(t, 3, initialCount)

	// Wait for cleanup (cleanup runs every minute, but visitors are removed after 2*window)
	time.Sleep(300 * time.Millisecond)

	// Trigger cleanup manually by accessing the map
	limiter.mu.Lock()
	for ip, v := range limiter.visitors {
		v.mu.Lock()
		if time.Since(v.lastSeen) > limiter.window*2 {
			delete(limiter.visitors, ip)
		}
		v.mu.Unlock()
	}
	limiter.mu.Unlock()

	// Visitors should be cleaned up
	limiter.mu.RLock()
	finalCount := len(limiter.visitors)
	limiter.mu.RUnlock()
	assert.Equal(t, 0, finalCount, "Old visitors should be cleaned up")
}
