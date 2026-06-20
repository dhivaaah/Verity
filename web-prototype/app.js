// Verity V1 — Google Maps Spatial UI Controller

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
            parking: "AVAILABLE",
            crowd: "QUIET",
            entrances: "OPEN"
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
let activeOverlays = [];
let activeGoogleMarkers = [];
let activeHeatCircles = [];
let userLocationMarker = null;
let selectedPlaceId = "p2";
let currentViewMode = "places"; 

const leaderboardData = [
    { rank: 1, name: "glassatlas", level: "Lattice", signal: 24180, ring: "Aurora", lat: 13.0600, lng: 80.2660 },
    { rank: 2, name: "stilltrue", level: "Vector", signal: 19420, ring: "Crystal", lat: 13.0570, lng: 80.2620 },
    { rank: 3, name: "dhiv_sentinel", level: "Prism", signal: 18420, ring: "Polar", lat: 13.0587, lng: 80.2641 },
    { rank: 4, name: "northsignal", level: "Pulse", signal: 14800, ring: "Normal", lat: 13.0620, lng: 80.2670 },
    { rank: 5, name: "quietpulse", level: "Trace", signal: 11200, ring: "Normal", lat: 13.0550, lng: 80.2600 }
];

// Custom HTML Overlay for Google Maps (retains animated glass orbs)
class CustomHtmlOverlay extends google.maps.OverlayView {
    constructor(latlng, html, onClick) {
        super();
        this.latlng = latlng;
        this.html = html;
        this.onClick = onClick;
        this.div = null;
    }
    onAdd() {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.cursor = 'pointer';
        div.innerHTML = this.html;
        div.onclick = (e) => {
            e.stopPropagation();
            this.onClick();
        };
        this.div = div;
        const panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(div);
    }
    draw() {
        const overlayProjection = this.getProjection();
        const position = overlayProjection.fromLatLngToDivPixel(this.latlng);
        if (this.div && position) {
            this.div.style.left = (position.x - 16) + 'px';
            this.div.style.top = (position.y - 16) + 'px';
        }
    }
    onRemove() {
        if (this.div) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initMap();
    startDecayEngine();
    renderLeaderboard("Nearby");
    setupPlaceSheetDrag();
    
    updateOdometer("profile-signal-val", veritySignal);
    setupSearchSuggestions();
});

function initMap() {
    const darkStyle = [
        { "elementType": "geometry", "stylers": [{ "color": "#12131C" }] },
        { "elementType": "labels.text.stroke", "stylers": [{ "color": "#12131C" }] },
        { "elementType": "labels.text.fill", "stylers": [{ "color": "#64748b" }] },
        { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1E202E" }] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#060814" }] },
        { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
        { "featureType": "poi", "stylers": [{ "visibility": "off" }] }
    ];

    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 13.0587, lng: 80.2641 },
        zoom: 13,
        disableDefaultUI: true,
        styles: darkStyle,
        gestureHandling: "greedy"
    });

    map.addListener("dragend", () => {
        streamNearbyPlacesOnDrag();
    });
    map.addListener("zoom_changed", () => {
        renderAllMarkers();
    });

    // Request native geolocation immediately on launch
    requestLiveLocationOnLaunch();
}

function requestLiveLocationOnLaunch() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                // Hide custom modal immediately since it was auto-granted by browser
                document.getElementById('location-permission-modal').style.display = 'none';
                
                // Center and zoom map to user
                map.setCenter({ lat: userLat, lng: userLng });
                map.setZoom(15);
                
                // Drop user marker dot
                if (userLocationMarker) userLocationMarker.setMap(null);
                userLocationMarker = new google.maps.Circle({
                    strokeColor: '#22d3ee',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#22d3ee',
                    fillOpacity: 0.15,
                    map: map,
                    center: { lat: userLat, lng: userLng },
                    radius: 80
                });

                renderAllMarkers();
                streamNearbyPlacesOnDrag(); // Stream places near user's real location
            },
            (error) => {
                console.warn("Native Geolocation failed/denied, keeping modal open:", error);
                // Default coordinates (Chennai Royapettah) are kept, permission modal stays open
                renderAllMarkers();
                selectPlace("p2");
            },
            { timeout: 5000 }
        );
    } else {
        renderAllMarkers();
        selectPlace("p2");
    }
}

function startDecayEngine() {
    setInterval(() => {
        places.forEach((p) => {
            const elapsedMinutes = (Date.now() - p.lastVerified) / (60 * 1000);
            const lambda = Math.log(2) / p.halfLife;
            const multiplier = 3.0; // Decay simulation multiplier
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
            desc: "Needs First Community Check",
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
    const zoom = map.getZoom();

    clearOverlays();
    clearHeatCircles();
    clearGoogleMarkers();

    if (currentViewMode === "leaderboard") {
        renderContributorAvatarsOnMap();
        return;
    }

    if (zoom < 12) {
        renderRegionalHeatHalos();
    } else {
        places.forEach(p => {
            const health = getPlaceHealth(p);
            const iconHtml = `
                <div class="marker-pin-spatial ${health.colorClass}">
                    <div class="spatial-dot"></div>
                </div>
            `;

            const latlng = new google.maps.LatLng(p.lat, p.lng);
            const overlay = new CustomHtmlOverlay(latlng, iconHtml, () => {
                selectPlace(p.id);
            });
            overlay.setMap(map);
            activeOverlays.push(overlay);
        });
    }
}

function clearOverlays() {
    activeOverlays.forEach(o => o.setMap(null));
    activeOverlays = [];
}

function clearGoogleMarkers() {
    activeGoogleMarkers.forEach(m => m.setMap(null));
    activeGoogleMarkers = [];
}

function clearHeatCircles() {
    activeHeatCircles.forEach(c => c.setMap(null));
    activeHeatCircles = [];
}

function renderRegionalHeatHalos() {
    const zones = [
        { lat: 12.9716, lng: 77.6412, label: "Quiet Area", color: "#10b981" },
        { lat: 13.0587, lng: 80.2641, label: "Activity Spike", color: "#ef4444" }
    ];

    zones.forEach(z => {
        const circle = new google.maps.Circle({
            strokeColor: z.color,
            strokeOpacity: 0.8,
            strokeWeight: 1,
            fillColor: z.color,
            fillOpacity: 0.15,
            map: map,
            center: { lat: z.lat, lng: z.lng },
            radius: 2000
        });
        activeHeatCircles.push(circle);
    });
}

function renderContributorAvatarsOnMap() {
    leaderboardData.forEach(user => {
        const glowColor = user.ring === "Aurora" ? "#a855f7" : (user.ring === "Crystal" ? "#cbd5e1" : "#06b6d4");
        const iconHtml = `
            <div class="marker-pin-spatial" style="background: rgba(255,255,255,0.05); border: 2px solid ${glowColor}; box-shadow: 0 0 15px ${glowColor}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <div style="font-size: 9px; font-weight: 700; color: #fff;">${user.name.substring(0, 2).toUpperCase()}</div>
            </div>
        `;

        const latlng = new google.maps.LatLng(user.lat, user.lng);
        const overlay = new CustomHtmlOverlay(latlng, iconHtml, () => {
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
        overlay.setMap(map);
        activeOverlays.push(overlay);
    });
}

function selectPlace(id) {
    selectedPlaceId = id;
    const p = places.find(item => item.id === id);
    if (!p) return;

    map.panTo({ lat: p.lat, lng: p.lng });
    closeAllSheets();
    
    updatePlaceSheetDetails();
    document.getElementById('place-sheet').classList.add('active');
    setDockActive('nav-search');
}

function updatePlaceSheetDetails() {
    const p = places.find(item => item.id === selectedPlaceId);
    if (!p) return;

    const health = getPlaceHealth(p);
    const contentArea = document.getElementById('sheet-content-area');
    
    let nowHtml = "";
    Object.keys(p.capabilities).forEach(key => {
        const val = p.capabilities[key].toUpperCase();
        let dot = "🟢";
        if (val === "BUSY" || val === "LIMITED") dot = "🟡";
        if (val === "FULL" || val === "CLOSED") dot = "🔴";
        nowHtml += `
            <div class="capability-row" style="margin-bottom:10px;">
                <span>${dot} ${key.toUpperCase()}</span>
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

        <div class="capabilities-list" style="margin: 20px 0;">
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

    p.confidence = 65.0; 
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
        renderAllMarkers(); 
        document.getElementById('leaderboard-panel').classList.add('active');
    } else if (tab === 'search') {
        currentViewMode = "places";
        renderAllMarkers();
        document.getElementById('conversational-search').focus();
    } else if (tab === 'feed') {
        currentViewMode = "places";
        renderAllMarkers();
        selectPlace("p2"); 
    } else if (tab === 'center-action') {
        // Elevated verification scanner trigger
        handleCenterAction();
    }
}

// Elevated validation scanner trigger
function handleCenterAction() {
    const center = map.getCenter();
    const lat = center.lat();
    const lng = center.lng();
    
    let closestPlace = null;
    let minDistance = Infinity;
    
    places.forEach(p => {
        const dist = Math.pow(p.lat - lat, 2) + Math.pow(p.lng - lng, 2);
        if (dist < minDistance) {
            minDistance = dist;
            closestPlace = p;
        }
    });
    
    if (closestPlace) {
        selectPlace(closestPlace.id);
        triggerLooksGood(closestPlace.id);
        
        // Show verification success toast
        const responseBox = document.getElementById('search-response-box');
        const responseText = document.getElementById('search-response-text');
        responseText.innerHTML = `
            <div style="font-size:10px; color:var(--state-healthy); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Instant Verification</div>
            🟢 Verified <strong>${closestPlace.name}</strong> as accurate. <strong class="text-cyan">+10 Signal</strong> awarded.
        `;
        responseBox.style.display = 'block';
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
    document.querySelector('.island-subtitle').textContent = "Just left Express Avenue? Was the parking full?";
    
    document.querySelector('.btn-island-primary').onclick = (e) => {
        e.stopPropagation();
        veritySignal += 10;
        updateOdometer("profile-signal-val", veritySignal);
        triggerVisualPulse();
        
        document.querySelector('.island-subtitle').textContent = "✓ Confirmations accepted. Thank you.";
        setTimeout(() => {
            dismissDynamicIsland();
        }, 1500);
    };

    map.panTo({ lat: 13.0587, lng: 80.2641 });
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

// Launches Weekly Reflection dashboard overlay
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
    
    if (scope === 'Global' || scope === 'India') {
        map.setZoom(5);
    } else {
        map.setZoom(15);
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

// --- Spotlight search suggestions setup ---
function setupSearchSuggestions() {
    const input = document.getElementById('conversational-search');
    input.addEventListener('focus', () => {
        const responseBox = document.getElementById('search-response-box');
        const responseText = document.getElementById('search-response-text');
        
        responseText.innerHTML = `
            <div style="font-size:10px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Recent Searches</div>
            <div style="cursor:pointer; margin-bottom:6px;" onclick="searchQuery('Is Express Avenue crowded?')">🔍 Is Express Avenue crowded?</div>
            <div style="cursor:pointer; margin-bottom:12px;" onclick="searchQuery('Working ATM nearby')">🔍 Working ATM nearby</div>
            
            <div style="font-size:10px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Nearby & Trending</div>
            <div style="cursor:pointer; margin-bottom:6px;" onclick="searchQuery('Marina Beach')">🏖 Marina Beach</div>
            <div style="cursor:pointer;" onclick="searchQuery('Brew Cafe')">☕ Brew Cafe</div>
        `;
        responseBox.style.display = 'block';
    });
}

// Expand or collapse place sheets when clicking drag handle
function setupPlaceSheetDrag() {
    const handle = document.querySelector('.sheet-drag-handle');
    const sheet = document.getElementById('place-sheet');
    if (handle && sheet) {
        handle.onclick = () => {
            sheet.classList.toggle('expanded-height');
        };
    }
}

function searchQuery(val) {
    const input = document.getElementById('conversational-search');
    input.value = val;
    triggerSearch();
}

function searchCategory(cat) {
    const target = places.find(p => p.category === cat);
    if (target) {
        selectPlace(target.id);
    } else {
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

// --- LOCATION PERMISSION FLOW & SETTINGS MOCKS ---
function acceptLocationPermission() {
    const modal = document.getElementById('location-permission-modal');
    modal.style.display = 'none';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                // Fly to actual user coordinate
                map.panTo({ lat: userLat, lng: userLng });
                map.setZoom(16);
                
                if (userLocationMarker) {
                    userLocationMarker.setMap(null);
                }
                userLocationMarker = new google.maps.Circle({
                    strokeColor: '#22d3ee',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#22d3ee',
                    fillOpacity: 0.15,
                    map: map,
                    center: { lat: userLat, lng: userLng },
                    radius: 60
                });
            },
            (error) => {
                console.warn("Geolocation API error, defaulting to Chennai grid:", error);
                fallbackLocationCenter();
            },
            { timeout: 5000 }
        );
    } else {
        fallbackLocationCenter();
    }
}

function fallbackLocationCenter() {
    map.panTo({ lat: 13.0587, lng: 80.2641 }); // Chennai Express Avenue grid default
    map.setZoom(15);
    
    if (userLocationMarker) {
        userLocationMarker.setMap(null);
    }
    userLocationMarker = new google.maps.Circle({
        strokeColor: '#22d3ee',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#22d3ee',
        fillOpacity: 0.15,
        map: map,
        center: { lat: 13.0587, lng: 80.2641 },
        radius: 80
    });
    setTimeout(() => {
        selectPlace("p2"); 
    }, 1500);
}

function denyLocationPermission() {
    const modal = document.getElementById('location-permission-modal');
    modal.style.display = 'none';
    fallbackLocationCenter();
}

function toggleBackgroundLocation() {
    const isChecked = document.getElementById('privacy-bg-location').checked;
    triggerVisualPulse();
    
    const banner = document.getElementById('search-response-box');
    const text = document.getElementById('search-response-text');
    text.innerHTML = `Privacy updated: Background Location verification is now <strong>${isChecked ? "ENABLED" : "DISABLED"}</strong>.`;
    banner.style.display = 'block';
}

function clearLocationHistory() {
    triggerVisualPulse();
    const banner = document.getElementById('search-response-box');
    const text = document.getElementById('search-response-text');
    text.innerHTML = `✓ <strong>Location history deleted successfully.</strong> Your local presence history has been purged from Verity.`;
    banner.style.display = 'block';
}

// --- CONTINUOUS PLACE DISCOVERY STREAMING ---
function streamNearbyPlacesOnDrag() {
    if (currentViewMode !== "places" || map.getZoom() < 13) return;

    const center = map.getCenter();
    const lat = center.lat();
    const lng = center.lng();

    const existingIndex = places.findIndex(p => Math.abs(p.lat - lat) < 0.003 && Math.abs(p.lng - lng) < 0.003);
    if (existingIndex !== -1) return;

    const names = ["A2B Restaurant", "Royapettah Metro Station", "SBI ATM Hub", "Government Library", "Apollo Pharmacy"];
    const cats = ["Restaurant", "Metro Station", "ATM", "Library", "Pharmacy"];
    const index = Math.floor(Math.random() * names.length);
    
    const newPlace = {
        id: 'p_stream_' + Date.now(),
        name: names[index],
        category: cats[index],
        locationDesc: "Simulated Place near current map center",
        lat: lat + (Math.random() - 0.5) * 0.002,
        lng: lng + (Math.random() - 0.5) * 0.002,
        confidence: 0, // Needs community check
        lastVerified: Date.now(),
        halfLife: 45,
        capabilities: {
            operational: "OPEN",
            status: "UNDER MAINTENANCE"
        },
        memoryStats: {
            reliability: "Needs First Community Check",
            totalUpdates: 0,
            activeDays: 0,
            peakCrowdTime: "Unknown"
        },
        patterns: ["No patterns verified yet"],
        timeline: []
    };

    places.push(newPlace);
    renderAllMarkers();
    
    const nodeCount = document.getElementById('hud-nodes-count');
    if (nodeCount) {
        nodeCount.textContent = places.length;
    }
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
