// Verity API Definitions for the Reality Maintenance Reputation and Notification Systems

package db

import (
	"time"
)

// Place represents a physical location in the universal directory.
type Place struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Category    string  `json:"category"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Description string  `json:"description"`
}

// LiveState represents the real-time dynamic state of a place.
type LiveState struct {
	ID              string                 `json:"id"`
	PlaceID         string                 `json:"place_id"`
	ConfidenceScore float64                `json:"confidence_score"`
	LiveTags        map[string]interface{} `json:"live_tags"`
	LastVerifiedAt  time.Time              `json:"last_verified_at"`
	ExpiresAt       time.Time              `json:"expires_at"`
}

// TimelineEntry represents an audit log entry of a state transition.
type TimelineEntry struct {
	ID            string                 `json:"id"`
	PlaceID       string                 `json:"place_id"`
	UserID        string                 `json:"user_id"`
	ActionType    string                 `json:"action_type"`
	RecordedState map[string]interface{} `json:"recorded_state"`
	CreatedAt     time.Time              `json:"created_at"`
}

// User represents a system user with their reliability score.
type User struct {
	ID               string  `json:"id"`
	Username         string  `json:"username"`
	ReliabilityScore float64 `json:"reliability_score"`
}


// UserProfile represents the prestigious, non-gamified identity of a Reality Maintainer.
type UserProfile struct {
	Username         string    `json:"username"`           // Unique globally (e.g., @northsignal)
	DisplayName      string    `json:"display_name"`       // User-customized display identity
	JoinedSince      time.Time `json:"joined_since"`       // User account creation timestamp
	VeritySignal     int64     `json:"verity_signal"`      // Accumulated trust metric ◉
	CurrentRank      string    `json:"current_rank"`       // Calculated original rank name (Echo to Verity)
	Level            int       `json:"level"`              // Progression level index (1 to 15)
	RealityStreak    int       `json:"reality_streak"`     // Number of places kept accurate this week
	CommunityImpact  int64     `json:"community_impact"`   // Cumulative unique user views helped
	PlacesMaintained int       `json:"places_maintained"`  // Count of verifications and corrections
	CorrectionsMade  int       `json:"corrections_made"`   // Count of corrected places
	AreaRank         int       `json:"area_rank"`          // Numeric ranking metrics
	TownRank         int       `json:"town_rank"`
	CityRank         int       `json:"city_rank"`
}

// SignalRewardRule defines values for trust-accumulating interactions.
type SignalRewardRule struct {
	ActionType string `json:"action_type"`
	AwardValue int64  `json:"award_value"`
}

var SignalRewards = []SignalRewardRule{
	{ActionType: "LOOKS_GOOD", AwardValue: 10},
	{ActionType: "VERIFIED_CORRECTION", AwardValue: 25},
	{ActionType: "CORRECTION_ACCEPTED", AwardValue: 40},
	{ActionType: "FRESH_PLACE_CHECK", AwardValue: 15},
	{ActionType: "CRITICAL_PLACE_RECOVERY", AwardValue: 60},
	{ActionType: "STREAK_MILESTONE", AwardValue: 100},
	{ActionType: "COMMUNITY_CHALLENGE", AwardValue: 250},
}

// WeeklyImpactReport represents the non-gamified Sunday reflection payload.
type WeeklyImpactReport struct {
	WeekNumber             int            `json:"week_number"`
	Title                  string         `json:"title"`                    // Rotated weekly (e.g., "Reality Report")
	Content                string         `json:"content"`                  // Human-first minimal text summary
	PlacesMaintained       int            `json:"places_maintained"`        // Number of locations checked
	CorrectionsAccepted    int            `json:"corrections_accepted"`      // Corrections verified by community
	CommunityReach         int64          `json:"community_reach"`          // Calculated unique consumer queries served
	RealityStreak          int            `json:"reality_streak"`           // Active streak metrics
	MostHelpfulContribution string         `json:"most_helpful_contribution"` // Category + Place name
	MostHelpfulReach       int64          `json:"most_helpful_reach"`       // Reach specific to that update
	MostActiveCategory     string         `json:"most_active_category"`
	MostActiveArea         string         `json:"most_active_area"`
	ReflectedAt            time.Time      `json:"reflected_at"`
}
