package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"verity/backend/internal/db"
	"verity/backend/internal/engine"

	"github.com/gorilla/websocket"
)

var (
	placesMu sync.RWMutex
	places   = make(map[string]*db.Place)
	states   = make(map[string]*db.LiveState)
	history  = make(map[string][]*db.TimelineEntry)
	users    = make(map[string]*db.User)

	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
	clients   = make(map[*websocket.Conn]bool)
	clientsMu sync.Mutex
)

func init() {
	// Initialize mock users
	users["u1"] = &db.User{ID: "u1", Username: "dhiv_sentinel", ReliabilityScore: 0.98}

	// Initialize mock places
	p1 := &db.Place{ID: "p1", Name: "Brew Cafe", Category: "Cafe", Latitude: 37.7749, Longitude: -122.4194, Description: "Downtown block"}
	p2 := &db.Place{ID: "p2", Name: "City Hospital", Category: "Hospital", Latitude: 37.7833, Longitude: -122.4167, Description: "Emergency room B"}
	p3 := &db.Place{ID: "p3", Name: "PVR Cinema", Category: "Cinema", Latitude: 37.7699, Longitude: -122.4468, Description: "Screen complex"}

	places[p1.ID] = p1
	places[p2.ID] = p2
	places[p3.ID] = p3

	// Initial States
	states[p1.ID] = &db.LiveState{
		ID:              "s1",
		PlaceID:         p1.ID,
		ConfidenceScore: 100,
		LiveTags:        map[string]interface{}{"open": true, "wifi": "working", "seats": "available"},
		LastVerifiedAt:  time.Now(),
		ExpiresAt:       time.Now().Add(45 * time.Minute),
	}

	states[p2.ID] = &db.LiveState{
		ID:              "s2",
		PlaceID:         p2.ID,
		ConfidenceScore: 90,
		LiveTags:        map[string]interface{}{"emergency": "open", "waiting_time": "20 min", "parking": "available"},
		LastVerifiedAt:  time.Now(),
		ExpiresAt:       time.Now().Add(180 * time.Minute),
	}

	states[p3.ID] = &db.LiveState{
		ID:              "s3",
		PlaceID:         p3.ID,
		ConfidenceScore: 95,
		LiveTags:        map[string]interface{}{"show_started": true, "parking": "full", "food_court": "busy"},
		LastVerifiedAt:  time.Now(),
		ExpiresAt:       time.Now().Add(45 * time.Minute),
	}
}

func main() {
	go startDecayEngineLoop()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/places", handleGetPlaces)
	mux.HandleFunc("/api/places/update-tags", handleUpdateTags)
	mux.HandleFunc("/ws", handleWebSocket)

	corsMux := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		mux.ServeHTTP(w, r)
	})

	fmt.Println("Verity Living Knowledge API running on :8080...")
	log.Fatal(http.ListenAndServe(":8080", corsMux))
}

func startDecayEngineLoop() {
	ticker := time.NewTicker(10 * time.Second)
	for range ticker.C {
		placesMu.Lock()
		for id, state := range states {
			place, ok := places[id]
			if !ok {
				continue
			}
			decayed := engine.CalculateDecayedConfidence(state.ConfidenceScore, state.LastVerifiedAt, place.Category)
			state.ConfidenceScore = decayed

			if decayed < 10.0 {
				state.ConfidenceScore = 0
				state.LiveTags = map[string]interface{}{"status": "ARCHIVED"}
				broadcastUpdate("archive", place.ID, state)
			} else {
				broadcastUpdate("decay", place.ID, state)
			}
		}
		placesMu.Unlock()
	}
}

func broadcastUpdate(action string, placeID string, state *db.LiveState) {
	clientsMu.Lock()
	defer clientsMu.Unlock()

	msg := map[string]interface{}{
		"action":   action,
		"place_id": placeID,
		"state":    state,
	}
	bytes, _ := json.Marshal(msg)

	for client := range clients {
		if err := client.WriteMessage(websocket.TextMessage, bytes); err != nil {
			client.Close()
			delete(clients, client)
		}
	}
}



// Stubs for simplicity and compilation
func handleGetPlaces(w http.ResponseWriter, r *http.Request) {
	placesMu.RLock()
	defer placesMu.RUnlock()

	type Output struct {
		Place *db.Place      `json:"place"`
		State *db.LiveState  `json:"state"`
		History []*db.TimelineEntry `json:"timeline"`
	}

	var list []Output
	for id, p := range places {
		list = append(list, Output{
			Place:   p,
			State:   states[id],
			History: history[id],
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

func handleUpdateTags(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input struct {
		PlaceID  string                 `json:"place_id"`
		UserID   string                 `json:"user_id"`
		LiveTags map[string]interface{} `json:"live_tags"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	placesMu.Lock()
	state, exists := states[input.PlaceID]
	if !exists {
		placesMu.Unlock()
		http.Error(w, "Place state not found", http.StatusNotFound)
		return
	}

	// Merge/override tags and set confidence to 100%
	for k, v := range input.LiveTags {
		state.LiveTags[k] = v
	}
	state.ConfidenceScore = 100.0
	state.LastVerifiedAt = time.Now()
	state.ExpiresAt = time.Now().Add(45 * time.Minute)

	// Append to history timelines
	entry := &db.TimelineEntry{
		ID:            fmt.Sprintf("t_%d", time.Now().UnixNano()),
		PlaceID:       input.PlaceID,
		UserID:        input.UserID,
		ActionType:    "tag_update",
		RecordedState: input.LiveTags,
		CreatedAt:     time.Now(),
	}
	history[input.PlaceID] = append(history[input.PlaceID], entry)
	placesMu.Unlock()

	broadcastUpdate("update", input.PlaceID, state)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(state)
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WS upgrade failed:", err)
		return
	}
	clientsMu.Lock()
	clients[conn] = true
	clientsMu.Unlock()

	defer func() {
		clientsMu.Lock()
		delete(clients, conn)
		clientsMu.Unlock()
		conn.Close()
	}()

	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}
