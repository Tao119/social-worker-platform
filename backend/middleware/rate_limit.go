package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimiter implements a simple token bucket rate limiter
type RateLimiter struct {
	visitors map[string]*Visitor
	mu       sync.RWMutex
	rate     int           // requests per window
	window   time.Duration // time window
}

// Visitor represents a client with rate limit tracking
type Visitor struct {
	lastSeen time.Time
	tokens   int
	mu       sync.Mutex
}

// NewRateLimiter creates a new rate limiter
// rate: maximum number of requests per window
// window: time window duration
func NewRateLimiter(rate int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*Visitor),
		rate:     rate,
		window:   window,
	}
	
	// Start cleanup goroutine
	go rl.cleanupVisitors()
	
	return rl
}

// getVisitor retrieves or creates a visitor entry
func (rl *RateLimiter) getVisitor(ip string) *Visitor {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	
	v, exists := rl.visitors[ip]
	if !exists {
		v = &Visitor{
			lastSeen: time.Now(),
			tokens:   rl.rate,
		}
		rl.visitors[ip] = v
	}
	
	return v
}

// Allow checks if a request should be allowed
func (rl *RateLimiter) Allow(ip string) bool {
	v := rl.getVisitor(ip)
	
	v.mu.Lock()
	defer v.mu.Unlock()
	
	now := time.Now()
	
	// Refill tokens if window has passed
	if now.Sub(v.lastSeen) > rl.window {
		v.tokens = rl.rate
		v.lastSeen = now
	}
	
	// Check if tokens available
	if v.tokens > 0 {
		v.tokens--
		return true
	}
	
	return false
}

// cleanupVisitors removes old visitor entries
func (rl *RateLimiter) cleanupVisitors() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	
	for range ticker.C {
		rl.mu.Lock()
		for ip, v := range rl.visitors {
			v.mu.Lock()
			if time.Since(v.lastSeen) > rl.window*2 {
				delete(rl.visitors, ip)
			}
			v.mu.Unlock()
		}
		rl.mu.Unlock()
	}
}

// RateLimitMiddleware creates a Gin middleware for rate limiting
func RateLimitMiddleware(rate int, window time.Duration) gin.HandlerFunc {
	limiter := NewRateLimiter(rate, window)
	
	return func(c *gin.Context) {
		ip := c.ClientIP()
		
		if !limiter.Allow(ip) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded. Please try again later.",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// StrictRateLimitMiddleware applies stricter rate limiting for sensitive endpoints
func StrictRateLimitMiddleware() gin.HandlerFunc {
	// 10 requests per minute for sensitive endpoints
	return RateLimitMiddleware(10, time.Minute)
}

// StandardRateLimitMiddleware applies standard rate limiting
func StandardRateLimitMiddleware() gin.HandlerFunc {
	// 100 requests per minute for standard endpoints
	return RateLimitMiddleware(100, time.Minute)
}
