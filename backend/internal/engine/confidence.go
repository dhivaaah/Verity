package engine

import (
	"math"
	"time"
)

// DecayConfig defines the half-lives for different volatility classes of truth reports.
type VolatilityClass string

const (
	HighVolatility   VolatilityClass = "high"   // e.g., traffic, police check, fuel queue
	MediumVolatility VolatilityClass = "medium" // e.g., ATM cash availability, shop open, accidents
	LowVolatility    VolatilityClass = "low"    // e.g., flood, power outage, construction
)

// GetHalfLife returns the half-life in minutes for a given volatility category.
func GetHalfLife(category string) float64 {
	switch category {
	case "Traffic", "Police Check", "Petrol Available", "Queue":
		return 15.0 // minutes
	case "ATM Cash", "ATM Offline", "Shop Open", "Shop Closed", "Accident", "Hospital Busy", "Noise", "Public Safety":
		return 45.0 // minutes
	case "Power Outage", "Power Restored", "Flood", "Road Closed", "Water Supply", "Internet Down", "Construction":
		return 180.0 // minutes
	default:
		return 30.0 // Default half-life
	}
}

// GetRadiusLimit returns the visibility and verification radius (in meters) for a category.
func GetRadiusLimit(category string) float64 {
	switch category {
	case "ATM Cash", "ATM Offline", "Shop Open", "Shop Closed", "Noise":
		return 300.0 // 300 meters
	case "Traffic", "Accident", "Petrol Available", "Queue":
		return 4000.0 // 4 km
	case "Flood", "Road Closed", "Construction", "Public Safety":
		return 2000.0 // 2 km
	case "Power Outage", "Power Restored", "Water Supply", "Internet Down":
		return 5000.0 // 5 km
	default:
		return 1000.0 // Default 1 km
	}
}

// CalculateDecayedConfidence calculates the confidence of a report based on the time elapsed.
// Formula: C(t) = C_0 * e^(-lambda * t)
func CalculateDecayedConfidence(initialConfidence float64, lastActivity time.Time, category string) float64 {
	elapsed := time.Since(lastActivity).Minutes()
	if elapsed < 0 {
		elapsed = 0
	}

	halfLife := GetHalfLife(category)
	lambda := math.Log(2) / halfLife
	decayed := initialConfidence * math.Exp(-lambda*elapsed)

	if decayed < 0.0 {
		return 0.0
	}
	if decayed > 100.0 {
		return 100.0
	}
	return decayed
}

// CalculateVerificationWeight calculates the user's report confirmation weight
// based on user reliability and distance from the report.
func CalculateVerificationWeight(userReliability float64, distanceMeters float64, category string) float64 {
	maxRadius := GetRadiusLimit(category)
	if distanceMeters > maxRadius {
		return 0.0
	}

	// Distance factor: cos(pi * d / (2 * R_max)) -> 1.0 at d=0, 0.0 at d=R_max
	distanceFactor := math.Cos((math.Pi * distanceMeters) / (2.0 * maxRadius))
	if distanceFactor < 0.0 {
		distanceFactor = 0.0
	}

	return userReliability * distanceFactor
}

// ApplyVerification updates confidence based on a new confirmation or disagreement.
// returns the updated confidence score.
func ApplyVerification(currentConfidence float64, weight float64, isPositive bool) float64 {
	var delta float64
	if isPositive {
		delta = weight * 15.0 // Boost factor
	} else {
		delta = -weight * 25.0 // Penalize factor (stronger than positive boost)
	}

	newConfidence := currentConfidence + delta
	if newConfidence > 100.0 {
		return 100.0
	}
	if newConfidence < 0.0 {
		return 0.0
	}
	return newConfidence
}
