package engine

import (
	"math"
	"testing"
	"time"
)

func TestCalculateDecayedConfidence(t *testing.T) {
	// Let's test a report with a 15-minute half-life (Traffic)
	category := "Traffic"
	initialConfidence := 100.0

	// 1. Immediately after verification, confidence should be 100
	conf := CalculateDecayedConfidence(initialConfidence, time.Now(), category)
	if math.Abs(conf-100.0) > 1e-9 {
		t.Errorf("Expected confidence 100, got %f", conf)
	}

	// 2. Exactly one half-life (15 minutes) later, confidence should be ~50
	lastActivity := time.Now().Add(-15 * time.Minute)
	conf = CalculateDecayedConfidence(initialConfidence, lastActivity, category)
	if math.Abs(conf-50.0) > 0.5 {
		t.Errorf("Expected confidence ~50.0 after 15 mins decay, got %f", conf)
	}
}

func TestCalculateVerificationWeight(t *testing.T) {
	category := "ATM Cash" // 300m limit
	reliability := 1.0

	// 1. User is exactly on the report spot (0 meters)
	weight := CalculateVerificationWeight(reliability, 0, category)
	if math.Abs(weight-1.0) > 1e-9 {
		t.Errorf("Expected weight 1.0 at distance 0, got %f", weight)
	}

	// 2. User is outside radius limit (301 meters)
	weight = CalculateVerificationWeight(reliability, 301, category)
	if weight != 0.0 {
		t.Errorf("Expected weight 0.0 outside radius, got %f", weight)
	}
}
