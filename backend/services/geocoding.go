package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

// GeocodingService handles address to coordinates conversion
type GeocodingService struct {
	client *http.Client
}

// GeocodingResult represents the result of geocoding
type GeocodingResult struct {
	Latitude  float64
	Longitude float64
	Found     bool
}

// GSIResponse represents the response from GSI (国土地理院) API
type GSIResponse []struct {
	Geometry struct {
		Coordinates []float64 `json:"coordinates"`
		Type        string    `json:"type"`
	} `json:"geometry"`
	Type       string `json:"type"`
	Properties struct {
		AddressCode string `json:"addressCode"`
		Title       string `json:"title"`
	} `json:"properties"`
}

// NewGeocodingService creates a new GeocodingService
func NewGeocodingService() *GeocodingService {
	return &GeocodingService{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// GeocodeAddress converts an address to latitude/longitude using GSI API
func (s *GeocodingService) GeocodeAddress(address string) (*GeocodingResult, error) {
	if address == "" {
		return &GeocodingResult{Found: false}, nil
	}

	// Build the API URL
	baseURL := "https://msearch.gsi.go.jp/address-search/AddressSearch"
	params := url.Values{}
	params.Add("q", address)

	reqURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())

	// Make the request
	resp, err := s.client.Get(reqURL)
	if err != nil {
		return nil, fmt.Errorf("failed to call geocoding API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return &GeocodingResult{Found: false}, nil
	}

	// Parse the response
	var gsiResp GSIResponse
	if err := json.NewDecoder(resp.Body).Decode(&gsiResp); err != nil {
		return nil, fmt.Errorf("failed to parse geocoding response: %w", err)
	}

	// Check if we got any results
	if len(gsiResp) == 0 || len(gsiResp[0].Geometry.Coordinates) < 2 {
		return &GeocodingResult{Found: false}, nil
	}

	// GSI returns [longitude, latitude] order
	return &GeocodingResult{
		Longitude: gsiResp[0].Geometry.Coordinates[0],
		Latitude:  gsiResp[0].Geometry.Coordinates[1],
		Found:     true,
	}, nil
}
