// Verity V1 — Spatial-First UI Controller

let places = [
    {
        id: "p1",
        name: "Brew Cafe",
        category: "Cafe",
        locationDesc: "Downtown block (near Metro exit 3)",
        lat: 37.7749,
        lng: -122.4194,
        confidence: 100,
        lastVerified: Date.now() - 3 * 60 * 1000,
        halfLife: 45,
        capabilities: {
            operational: "OPEN",
            wifi: "WiFi Working",
            seats: "Seats Available",
            crowd: "Moderate Crowd"
        },
        memoryStats: {
            reliability: "99% of last 30 days",
            totalUpdates: 42,
            activeDays: 30,
            peakCrowdTime: "6:00 PM"
        },
        patterns: ["Usually crowded after 6 PM", "Quiet mornings"],
        timeline: [
            { time: "11:40 AM", text: "WiFi status confirmed active", positive: true },
            { time: "12:05 PM", text: "Verified seats available", positive: true }
        ]
    },
    {
        id: "p2",
        name: "SF International Airport",
        category: "Airport",
        locationDesc: "Main Highway Terminal Grid",
        lat: 37.7833,
        lng: -122.4167,
        confidence: 95,
        lastVerified: Date.now() - 2 * 60 * 1000,
        halfLife: 180,
        capabilities: {
            operational: "Terminal Open",
            taxi: "Taxi Queue Low",
            parking: "Parking Available"
        },
        memoryStats: {
            reliability: "98% of last 30 days",
            totalUpdates: 184,
            activeDays: 30,
            peakCrowdTime: "8:00 AM"
        },
        patterns: ["Heaviest congestion on Friday evenings", "Taxi queue peak at 9 AM"],
        timeline: [
            { time: "8:05 AM", text: "Security lines moving fast", positive: true }
        ]
    },
    {
        id: "p3",
        name: "City Hospital",
        category: "Hospital",
        locationDesc: "North Wing Complex",
        lat: 37.7699,
        lng: -122.4468,
        confidence: 90,
        lastVerified: Date.now() - 25 * 60 * 1000,
        halfLife: 180,
        capabilities: {
            operational: "Emergency Open",
            capacity: "Wait < 20 min",
            parking: "Parking Available"
        },
        memoryStats: {
            reliability: "100% of last 30 days",
            totalUpdates: 96,
            activeDays: 30,
            peakCrowdTime: "10:00 AM"
        },
        patterns: ["Usually busy on Monday mornings", "Parking typically full in afternoon"],
        timeline: [
            { time: "9:00 AM", text: "Emergency unit active and clear", positive: true }
        ]
    }
];

// Configuration definitions
const updateOptions = {
    "Cafe": ["WiFi Down", "No Seats", "AC Not Working", "Closed"],
    "Airport": ["Terminal Closed", "Taxi Delay", "Parking Full", "Security Delay"],
    "Hospital": ["Emergency Unit Closed", "Wait > 40 min", "Parking Full", "Pharmacy Closed"],
    "ATM": ["Out of Cash", "Card Slot Broken", "Offline", "Queue"]
};

// Seeding global variables
let veritySignal = 18420;
let userStreak = 28;
let peopleHelped = 82412;
let map;
let markers = {};
let selectedPlaceId = "p1";
let currentIslandAction = "exit-sfo";

const leaderboardData = [
    { rank: 1, name: "glassatlas", level: "Lattice", signal: 24180, ring: "Aurora" },
    { rank: 2, name: "stilltrue", level: "Vector", signal: 19420, ring: "Crystal" },
    { rank: 3, name: "dhiv_sentinel", level: "Prism", signal: 18420, ring: "Polar" },
    { rank: 4, name: "northsignal", level: "Pulse", signal: 14800, ring: "Normal" },
    { rank: 5, name: "quietpulse", level: "Trace", signal: 11200, ring: "Normal" }
];

window.addEventListener('DOMContentLoaded', () => {
    initMap();
    startDecayEngine();
    renderLeaderboard("Nearby");
    
    // Set initial Signal values in DOM
    updateOdometer("profile-signal-val", veritySignal);
});

function initMap() {
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([37.7749, -122.4194], 14);

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
            // Simulated 3x decay speed to show in real time
            const multiplier = 3.0;
            const newConfidence = 100 * Math.exp(-lambda * elapsedMinutes * multiplier);

            if (newConfidence <= 10.0) {
                p.confidence = 0;
            } else {
                p.confidence = newConfidence;
            }
        });
        updatePlaceSheetDetails();
        renderAllMarkers();
    }, 2000);
}

function getPlaceHealth(p) {
    const c = p.confidence;
    if (c <= 10.0) {
        return {
            statusLabel: "Awaiting Check",
            desc: "Needs verification",
            colorClass: "inactive",
            hexColor: "#6b7280",
            badgeClass: "badge-inactive"
        };
    }
    if (c < 75) {
        return {
            statusLabel: "Checking",
            desc: "Status updates reported",
            colorClass: "attention",
            hexColor: "#f59e0b",
            badgeClass: "badge-attention"
        };
    }
    return {
        statusLabel: "Healthy",
        desc: "Community verified",
        colorClass: "healthy",
        hexColor: "#10b981",
        badgeClass: "badge-healthy"
    };
}

function renderAllMarkers() {
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
        } else {
            const marker = L.marker([p.lat, p.lng], { icon: customIcon }).addTo(map);
            marker.on('click', () => {
                selectPlace(p.id);
            });
            markers[p.id] = marker;
        }
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
        nowHtml += `
            <div class="capability-row">
                <span>${key.toUpperCase()}</span>
                <strong>${p.capabilities[key]}</strong>
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
                <div class="place-category-pill">${p.category}</div>
            </div>
            <div class="status-badge-hero ${health.badgeClass}">
                ● ${health.statusLabel}
            </div>
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

    // Pulse signal score and show soft vibration visual
    veritySignal += 10;
    updateOdometer("profile-signal-val", veritySignal);
    
    // Add micro haptic haptic feedback simulation visual on screen
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

    p.confidence = 90.0; // Needs confirmation verification
    p.lastVerified = Date.now();

    checkedOptions.forEach(opt => {
        if (opt.includes("WiFi") || opt.includes("offline")) p.capabilities.wifi = "WiFi Down";
        if (opt.includes("Seats") || opt.includes("No Seats")) p.capabilities.seats = "No Seats Available";
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
        document.getElementById('profile-sheet').classList.add('active');
    } else if (tab === 'leaderboard') {
        document.getElementById('leaderboard-panel').classList.add('active');
    } else if (tab === 'search') {
        // Scroll to search or focus
        document.getElementById('conversational-search').focus();
    } else if (tab === 'feed') {
        // Feed returns view to SFO (default)
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
    
    // Map moves to SFO (SFO is the place for verification)
    map.panTo([37.7833, -122.4167]);
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
}

function renderLeaderboard(scope) {
    const container = document.getElementById('leaderboard-entries');
    
    // Sort or modify data by scope simulated values
    let scopeData = [...leaderboardData];
    if (scope === 'Nearby') {
        scopeData = scopeData.filter(item => item.rank > 1);
    }
    
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
    }
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
            WiFi is <strong>working</strong> and there are <strong>seats available</strong>.
        `;
        selectPlace('p1');
    } else if (query.includes('airport') || query.includes('sfo')) {
        const apt = places.find(p => p.id === 'p2');
        answer = `
            <strong>SF International Airport:</strong> Terminal state is 🟢 <strong>${apt.capabilities.operational}</strong>. 
            Taxi Queue: <strong>Low wait times</strong>.
        `;
        selectPlace('p2');
    } else if (query.includes('hospital') || query.includes('er')) {
        const hosp = places.find(p => p.id === 'p3');
        answer = `
            <strong>City Hospital ER:</strong> Status is 🟢 <strong>${hosp.capabilities.operational}</strong>. 
            Waiting: <strong>&lt; 20 min wait time</strong>.
        />`;
        selectPlace('p3');
    } else {
        answer = `Scanned living graph. No active events matching "${query}". Try searching "Is SFO terminal running?"`;
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
    // Add visual haptic flash to main viewport
    const container = document.body;
    container.style.boxShadow = "inset 0 0 20px rgba(34, 211, 238, 0.15)";
    setTimeout(() => {
        container.style.boxShadow = "none";
    }, 300);
}
