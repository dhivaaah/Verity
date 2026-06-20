// Verity V1 — Spatial-First UI Controller (India First Grid)

let places = [
    {
        id: "p1",
        name: "Brew Cafe (Indiranagar)",
        category: "Cafe",
        locationDesc: "Indiranagar 100 Feet Rd, Bangalore",
        lat: 12.9716,
        lng: 77.6412,
        confidence: 100,
        lastVerified: Date.now() - 3 * 60 * 1000,
        halfLife: 45,
        capabilities: {
            operational: "OPEN",
            wifi: "AVAILABLE",
            seats: "LIMITED",
            crowd: "QUIET"
        },
        memoryStats: {
            reliability: "99% of last 30 days",
            totalUpdates: 42,
            activeDays: 30,
            peakCrowdTime: "6:00 PM"
        },
        patterns: ["Usually busy after 6 PM", "Quiet mornings"],
        timeline: [
            { time: "11:40 AM", text: "WiFi status confirmed active", positive: true },
            { time: "12:05 PM", text: "Verified seats available", positive: true }
        ]
    },
    {
        id: "p2",
        name: "Express Avenue Mall (Royapettah)",
        category: "Mall",
        locationDesc: "Whites Rd, Royapettah, Chennai",
        lat: 13.0587,
        lng: 80.2641,
        confidence: 95,
        lastVerified: Date.now() - 2 * 60 * 1000,
        halfLife: 180,
        capabilities: {
            operational: "OPEN",
            parking: "LIMITED",
            crowd: "BUSY"
        },
        memoryStats: {
            reliability: "98% of last 30 days",
            totalUpdates: 184,
            activeDays: 30,
            peakCrowdTime: "8:00 AM"
        },
        patterns: ["Heaviest congestion on Sunday evenings", "Parking typically full by 5 PM"],
        timeline: [
            { time: "3:05 PM", text: "Parking slots limited at lower levels", positive: true }
        ]
    },
    {
        id: "p3",
        name: "Marina Beach (Chennai)",
        category: "Beach",
        locationDesc: "Marina Beach Road, Chennai",
        lat: 13.0475,
        lng: 80.2824,
        confidence: 90,
        lastVerified: Date.now() - 25 * 60 * 1000,
        halfLife: 180,
        capabilities: {
            operational: "AVAILABLE",
            safety: "UNDER MAINTENANCE",
            crowd: "BUSY"
        },
        memoryStats: {
            reliability: "100% of last 30 days",
            totalUpdates: 96,
            activeDays: 30,
            peakCrowdTime: "5:30 PM"
        },
        patterns: ["Extremely crowded during weekends", "Safe swimming zones restricted"],
        timeline: [
            { time: "5:00 PM", text: "Crowd at peak near Gandhi statue", positive: true }
        ]
    },
    {
        id: "p4",
        name: "Phoenix Marketcity (Whitefield)",
        category: "Mall",
        locationDesc: "Whitefield Main Rd, Bangalore",
        lat: 12.9958,
        lng: 77.6964,
        confidence: 85,
        lastVerified: Date.now() - 15 * 60 * 1000,
        halfLife: 120,
        capabilities: {
            operational: "OPEN",
            parking: "FULL",
            crowd: "BUSY"
        },
        memoryStats: {
            reliability: "97% of last 30 days",
            totalUpdates: 110,
            activeDays: 30,
            peakCrowdTime: "7:00 PM"
        },
        patterns: ["High traffic on outer ring road entrance", "Parking slots full during weekends"],
        timeline: [
            { time: "6:00 PM", text: "Multi-level parking full", positive: true }
        ]
    }
];

// Configuration definitions for India categories
const updateOptions = {
    "Cafe": ["WiFi Down", "No Seats", "AC Not Working", "Closed"],
    "Mall": ["Parking Full", "Crowded Entrance", "Escalator Offline", "Closed"],
    "Beach": ["High Tide Warning", "Extremely Busy", "Restricted Area", "Polluted Area"],
    "ATM": ["Out of Cash", "Card Slot Broken", "Offline", "Queue"]
};

// Seeding global variables
let veritySignal = 18420;
let userStreak = 28;
let peopleHelped = 82412;
let map;
let markers = {};
let contributorMarkers = [];
let selectedPlaceId = "p1";
let currentViewMode = "places"; // "places" or "leaderboard"

// Mock Google Places API status
let googlePlacesAPILoaded = true;

const leaderboardData = [
    { rank: 1, name: "glassatlas", level: "Lattice", signal: 24180, ring: "Aurora", lat: 12.9730, lng: 77.6425 },
    { rank: 2, name: "stilltrue", level: "Vector", signal: 19420, ring: "Crystal", lat: 12.9705, lng: 77.6398 },
    { rank: 3, name: "dhiv_sentinel", level: "Prism", signal: 18420, ring: "Polar", lat: 12.9716, lng: 77.6412 },
    { rank: 4, name: "northsignal", level: "Pulse", signal: 14800, ring: "Normal", lat: 12.9745, lng: 77.6438 },
    { rank: 5, name: "quietpulse", level: "Trace", signal: 11200, ring: "Normal", lat: 12.9690, lng: 77.6375 }
];

window.addEventListener('DOMContentLoaded', () => {
    initMap();
    startDecayEngine();
    renderLeaderboard("Nearby");
    
    // Set initial Signal values in DOM
    updateOdometer("profile-signal-val", veritySignal);
});

function initMap() {
    // Center map around Bangalore, Indiranagar (India First grid)
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([12.9716, 77.6412], 15);

    // Sleek premium CartoDB Dark map styling
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
    }).addTo(map);

    renderAllMarkers();
    selectPlace("p1"); // Set default
}

function startDecayEngine() {
    setInterval(() => {
        places.forEach((p) => {
            const elapsedMinutes = (Date.now() - p.lastVerified) / (60 * 1000);
            const lambda = Math.log(2) / p.halfLife;
            const multiplier = 3.0; // Fast decay simulation
            const newConfidence = 100 * Math.exp(-lambda * elapsedMinutes * multiplier);

            if (newConfidence <= 10.0) {
                p.confidence = 0;
            } else {
                p.confidence = newConfidence;
            }
        });
        if (currentViewMode === "places") {
            updatePlaceSheetDetails();
        }
        renderAllMarkers();
    }, 2000);
}

function getPlaceHealth(p) {
    const c = p.confidence;
    if (c <= 10.0) {
        return {
            statusLabel: "UNDER MAINTENANCE",
            desc: "Needs fresh check",
            colorClass: "inactive",
            hexColor: "#6b7280",
            badgeClass: "badge-inactive"
        };
    }
    if (c < 75) {
        return {
            statusLabel: "LIMITED",
            desc: "Status updates reported",
            colorClass: "attention",
            hexColor: "#f59e0b",
            badgeClass: "badge-attention"
        };
    }
    return {
        statusLabel: p.capabilities.operational || "OPEN",
        desc: "Reality looks stable. Everything recently confirmed.",
        colorClass: "healthy",
        hexColor: "#10b981",
        badgeClass: "badge-healthy"
    };
}

function renderAllMarkers() {
    // Clear any contributor markers if in places mode
    if (currentViewMode === "places") {
        clearContributorMarkers();
        places.forEach(p => {
            const health = getPlaceHealth(p);
            const iconHtml = `
                <div class="marker-pin-spatial ${health.colorClass}">
                    <div class="spatial-dot"></div>
                </div>
            `;

            const customIcon = L.divIcon({
                html: iconHtml,
                className: 'spatial-marker-icon',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            if (markers[p.id]) {
                markers[p.id].setIcon(customIcon);
                // Ensure marker remains on map
                if (!map.hasLayer(markers[p.id])) {
                    markers[p.id].addTo(map);
                }
            } else {
                const marker = L.marker([p.lat, p.lng], { icon: customIcon }).addTo(map);
                marker.on('click', () => {
                    selectPlace(p.id);
                });
                markers[p.id] = marker;
            }
        });
    } else {
        // Leaderboard mode: hide places, show glowing contributors
        hidePlaceMarkers();
        renderContributorAvatarsOnMap();
    }
}

function hidePlaceMarkers() {
    Object.keys(markers).forEach(id => {
        map.removeLayer(markers[id]);
    });
}

function clearContributorMarkers() {
    contributorMarkers.forEach(m => map.removeLayer(m));
    contributorMarkers = [];
}

function renderContributorAvatarsOnMap() {
    clearContributorMarkers();
    leaderboardData.forEach(user => {
        // Avatar marker with glowing aura
        const glowColor = user.ring === "Aurora" ? "#a855f7" : (user.ring === "Crystal" ? "#cbd5e1" : "#06b6d4");
        const iconHtml = `
            <div class="marker-pin-spatial" style="background: rgba(255,255,255,0.05); border: 2px solid ${glowColor}; box-shadow: 0 0 15px ${glowColor}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <div style="font-size: 9px; font-weight: 700; color: #fff;">${user.name.substring(0, 2).toUpperCase()}</div>
            </div>
        `;

        const customIcon = L.divIcon({
            html: iconHtml,
            className: 'contributor-avatar-marker',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        const marker = L.marker([user.lat, user.lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => {
            // Display mini card inside search response box or console
            const responseBox = document.getElementById('search-response-box');
            const responseText = document.getElementById('search-response-text');
            responseText.innerHTML = `
                <strong style="font-size:15px; color:#fff;">@${user.name}</strong><br/>
                Level: <span class="text-cyan">${user.level}</span><br/>
                Accumulated Trust: <strong>◉ ${user.signal.toLocaleString()} Signal</strong><br/>
                Joined Since: <strong>June 2026</strong>
            `;
            responseBox.style.display = 'block';
        });
        contributorMarkers.push(marker);
    });
}

function selectPlace(id) {
    selectedPlaceId = id;
    const p = places.find(item => item.id === id);
    if (!p) return;

    // Pan map smoothly to place
    map.panTo([p.lat, p.lng]);
    
    // Close other sheets
    closeAllSheets();
    
    // Load content and slide up place sheet
    updatePlaceSheetDetails();
    document.getElementById('place-sheet').classList.add('active');
    
    // Set active tab on dock
    setDockActive('nav-search');
}

function updatePlaceSheetDetails() {
    const p = places.find(item => item.id === selectedPlaceId);
    if (!p) return;

    const health = getPlaceHealth(p);
    const contentArea = document.getElementById('sheet-content-area');
    
    let nowHtml = "";
    Object.keys(p.capabilities).forEach(key => {
        // Translate status flags into absolute uppercase tokens
        const val = p.capabilities[key].toUpperCase();
        nowHtml += `
            <div class="capability-row">
                <span>${key.toUpperCase()}</span>
                <strong>${val}</strong>
            </div>
        `;
    });

    let recentHtml = "";
    p.timeline.slice(0, 3).forEach(item => {
        recentHtml += `• ${item.time} — ${item.text}<br/>`;
    });

    let usuallyHtml = `• Reliability: ${p.memoryStats.reliability}<br/>`;
    p.patterns.forEach(pat => {
        usuallyHtml += `• ${pat}<br/>`;
    });

    const formOptions = updateOptions[p.category] || ["Offline", "Closed"];
    const optionsHtml = formOptions.map(opt => `
        <div class="form-option-row">
            <input type="checkbox" name="corrections" value="${opt}" id="chk-${opt}">
            <label for="chk-${opt}">${opt}</label>
        </div>
    `).join('');

    contentArea.innerHTML = `
        <div class="place-sheet-header">
            <div class="place-title-section">
                <h2>${p.name}</h2>
                <div class="place-category-pill">${p.category} — ${p.locationDesc}</div>
            </div>
            <div class="status-badge-hero ${health.badgeClass}">
                ● ${health.statusLabel}
            </div>
        </div>

        <div style="font-size: 11px; color: var(--text-tertiary); margin-bottom: 12px; font-style: italic;">
            ${health.desc}
        </div>

        <div class="capabilities-list">
            ${nowHtml}
        </div>

        <button class="looks-good-btn-large" onclick="triggerLooksGood('${p.id}', event)">✓ Looks Good</button>
        <button class="something-changed-link" onclick="toggleCorrectionsForm(event)">Something changed?</button>

        <div class="corrections-form-sheet" id="corrections-console">
            <h4 style="font-size: 11px; color: var(--text-tertiary); letter-spacing: 0.5px; margin-bottom: 12px; text-transform: uppercase;">Specify what changed</h4>
            ${optionsHtml}
            <input type="text" class="form-text-input" id="other-correction-txt" placeholder="Optional details (max 100 chars)" maxlength="100">
            <button class="btn-form-submit" onclick="submitCorrections('${p.id}', event)">Submit updates</button>
        </div>

        <div class="sheet-divider"></div>

        <div class="collapsible-section" id="section-recent">
            <button class="collapsible-trigger" onclick="toggleCollapsible('section-recent')">
                <span>RECENT HISTORY</span>
                <span>▾</span>
            </button>
            <div class="collapsible-content">
                ${recentHtml || "No recent verification logs."}
            </div>
        </div>

        <div class="collapsible-section" id="section-usually">
            <button class="collapsible-trigger" onclick="toggleCollapsible('section-usually')">
                <span>MEMORIES & PATTERNS</span>
                <span>▾</span>
            </button>
            <div class="collapsible-content">
                ${usuallyHtml}
            </div>
        </div>
    `;
}

function triggerLooksGood(id, event) {
    if (event) event.stopPropagation();
    const p = places.find(item => item.id === id);
    if (!p) return;

    p.confidence = 100.0;
    p.lastVerified = Date.now();

    // Pulse signal score
    veritySignal += 10;
    updateOdometer("profile-signal-val", veritySignal);
    triggerVisualPulse();

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    p.timeline.unshift({ time: timeStr, text: "Verified looks good", positive: true });
    p.memoryStats.totalUpdates += 1;

    updatePlaceSheetDetails();
    renderAllMarkers();
}

function toggleCorrectionsForm(event) {
    if (event) event.stopPropagation();
    const form = document.getElementById('corrections-console');
    form.classList.toggle('active');
}

function submitCorrections(id, event) {
    if (event) event.stopPropagation();
    const p = places.find(item => item.id === id);
    if (!p) return;

    const checkedOptions = Array.from(document.querySelectorAll('input[name="corrections"]:checked')).map(el => el.value);
    const customTxt = document.getElementById('other-correction-txt').value.trim();

    if (checkedOptions.length === 0 && !customTxt) {
        return;
    }

    p.confidence = 65.0; // Drops to Checking
    p.lastVerified = Date.now();

    checkedOptions.forEach(opt => {
        if (opt.includes("WiFi") || opt.includes("offline")) p.capabilities.wifi = "WiFi Down";
        if (opt.includes("Seats") || opt.includes("No Seats")) p.capabilities.seats = "No Seats";
        if (opt.includes("Closed")) p.capabilities.operational = "CLOSED";
    });

    veritySignal += 25;
    updateOdometer("profile-signal-val", veritySignal);
    triggerVisualPulse();

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    p.timeline.unshift({ time: timeStr, text: `Corrected: ${checkedOptions.join(', ')}`, positive: false });
    p.memoryStats.totalUpdates += 1;

    updatePlaceSheetDetails();
    renderAllMarkers();
}

function toggleCollapsible(id) {
    const el = document.getElementById(id);
    el.classList.toggle('open');
}

// --- DOCK NAVIGATION FLOW ---
function handleDockNav(tab) {
    closeAllSheets();
    setDockActive(`nav-${tab}`);

    if (tab === 'profile') {
        currentViewMode = "places";
        renderAllMarkers();
        document.getElementById('profile-sheet').classList.add('active');
    } else if (tab === 'leaderboard') {
        currentViewMode = "leaderboard";
        renderAllMarkers(); // Re-render markers as glowing avatars
        document.getElementById('leaderboard-panel').classList.add('active');
    } else if (tab === 'search') {
        currentViewMode = "places";
        renderAllMarkers();
        document.getElementById('conversational-search').focus();
    } else if (tab === 'feed') {
        currentViewMode = "places";
        renderAllMarkers();
        selectPlace("p1");
    }
}

function toggleProfileSheet() {
    document.getElementById('profile-sheet').classList.remove('active');
    setDockActive('nav-feed');
}

function closeAllSheets() {
    document.getElementById('place-sheet').classList.remove('active');
    document.getElementById('profile-sheet').classList.remove('active');
    document.getElementById('leaderboard-panel').classList.remove('active');
}

function setDockActive(id) {
    document.querySelectorAll('.dock-nav-item').forEach(el => el.classList.remove('active'));
    const item = document.getElementById(id);
    if (item) item.classList.add('active');
}

// --- DYNAMIC ISLAND NOTIFICATION & SIMULATION ---
function triggerGeofenceExit() {
    const island = document.getElementById('dynamic-island');
    island.className = "dynamic-island-expanded";
    
    // Simulate SFO details in the island header
    document.querySelector('.island-subtitle').textContent = "Just left Express Avenue? Was the parking full?";
    
    // Setup dynamic island action click triggers
    document.querySelector('.btn-island-primary').onclick = (e) => {
        e.stopPropagation();
        veritySignal += 10;
        updateOdometer("profile-signal-val", veritySignal);
        triggerVisualPulse();
        
        // Show success state inside dynamic island
        document.querySelector('.island-subtitle').textContent = "✓ Confirmations accepted. Thank you.";
        setTimeout(() => {
            dismissDynamicIsland();
        }, 1500);
    };

    map.panTo([13.0587, 80.2641]);
    selectPlace("p2");
}

function expandDynamicIsland() {
    const island = document.getElementById('dynamic-island');
    if (island.classList.contains('dynamic-island-collapsed')) {
        island.className = "dynamic-island-expanded";
    }
}

function dismissDynamicIsland(event) {
    if (event) event.stopPropagation();
    const island = document.getElementById('dynamic-island');
    island.className = "dynamic-island-collapsed";
}

function openWeeklyReflection(event) {
    if (event) event.stopPropagation();
    dismissDynamicIsland();
    document.getElementById('reflection-modal').classList.add('active');
}

function closeWeeklyReflection() {
    document.getElementById('reflection-modal').classList.remove('active');
}

// --- LEADERBOARD SCOPE SWAPPING ---
function switchLeaderboardScope(scope) {
    document.querySelectorAll('.scope-tab').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
    renderLeaderboard(scope);
    
    // Adjust map markers relative to scope coordinates
    if (scope === 'Global' || scope === 'India') {
        map.setView([12.9716, 77.6412], 5);
    } else {
        map.setView([12.9716, 77.6412], 14);
    }
    renderAllMarkers();
}

function renderLeaderboard(scope) {
    const container = document.getElementById('leaderboard-entries');
    let scopeData = [...leaderboardData];
    
    container.innerHTML = scopeData.map(user => {
        const ringClass = `avatar-ring${user.ring}`;
        const isSelf = user.name === "dhiv_sentinel" ? "highlighted" : "";
        return `
            <div class="leaderboard-row ${isSelf}">
                <div class="leaderboard-left">
                    <span class="leaderboard-rank">#${user.rank}</span>
                    <div class="${ringClass}" style="width: 32px; height: 32px; display:flex; align-items:center; justify-content:center;">
                        <div style="background: rgba(255,255,255,0.06); width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700;">
                            ${user.name.substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                    <div>
                        <strong>@${user.name}</strong>
                        <span style="display:block; font-size:9px; color:var(--text-tertiary);">${user.level}</span>
                    </div>
                </div>
                <div class="leaderboard-right">
                    <strong>◉ ${user.signal.toLocaleString()}</strong>
                </div>
            </div>
        `;
    }).join('');
}

// --- SEARCH ENGINE INTERFACE ---
function searchCategory(cat) {
    const target = places.find(p => p.category === cat);
    if (target) {
        selectPlace(target.id);
    } else {
        // Fallback: Simulate Google Places API metadata fetch
        simulateGooglePlacesFetch(cat);
    }
}

function simulateGooglePlacesFetch(query) {
    const responseBox = document.getElementById('search-response-box');
    const responseText = document.getElementById('search-response-text');

    responseText.innerHTML = `
        <div style="font-size:10px; color:var(--accent-cyan); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Google Places API Live Fetch</div>
        <strong>Populating "${query}" location grid...</strong><br/>
        Fetched 5 results near your area. Tapping the markers will populate live capabilities now.
    `;
    responseBox.style.display = 'block';
}

function handleSearch(event) {
    if (event.key === 'Enter') {
        triggerSearch();
    }
}

function triggerSearch() {
    const input = document.getElementById('conversational-search');
    const query = input.value.toLowerCase().trim();
    if (!query) return;

    const responseBox = document.getElementById('search-response-box');
    const responseText = document.getElementById('search-response-text');

    let answer = "";
    if (query.includes('cafe') || query.includes('brew') || query.includes('coffee')) {
        const cafe = places.find(p => p.id === 'p1');
        answer = `
            <strong>Brew Cafe:</strong> Status is 🟢 <strong>${cafe.capabilities.operational}</strong>. 
            WiFi is <strong>AVAILABLE</strong> and there are <strong>seats available</strong>.
        `;
        selectPlace('p1');
    } else if (query.includes('express avenue') || query.includes('ea') || query.includes('marina')) {
        const apt = places.find(p => p.id === 'p2');
        answer = `
            <strong>Express Avenue Mall:</strong> Terminal state is 🟢 <strong>${apt.capabilities.operational}</strong>. 
            Parking slots: <strong>LIMITED</strong>.
        `;
        selectPlace('p2');
    } else if (query.includes('hospital') || query.includes('er')) {
        const hosp = places.find(p => p.id === 'p3');
        answer = `
            <strong>City Hospital ER:</strong> Status is 🟢 <strong>${hosp.capabilities.operational}</strong>. 
            Waiting: <strong>Wait &lt; 20 min</strong>.
        `;
        selectPlace('p3');
    } else {
        simulateGooglePlacesFetch(query);
        return;
    }

    responseText.innerHTML = answer;
    responseBox.style.display = 'block';
}

function clearSearch() {
    document.getElementById('conversational-search').value = "";
    document.getElementById('search-response-box').style.display = 'none';
}

// --- UTILITY EFFECTS & MICRO-HAPTICS ---
function updateOdometer(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    
    let currentVal = parseInt(el.textContent.replace(/,/g, '')) || 0;
    const diff = value - currentVal;
    if (diff === 0) return;

    const steps = 15;
    const stepVal = diff / steps;
    let stepCount = 0;

    const interval = setInterval(() => {
        stepCount++;
        currentVal += stepVal;
        el.textContent = Math.round(currentVal).toLocaleString();
        
        if (stepCount >= steps) {
            clearInterval(interval);
            el.textContent = value.toLocaleString();
        }
    }, 20);
}

function triggerVisualPulse() {
    const container = document.body;
    container.style.boxShadow = "inset 0 0 25px rgba(34, 211, 238, 0.2)";
    setTimeout(() => {
        container.style.boxShadow = "none";
    }, 300);
}
