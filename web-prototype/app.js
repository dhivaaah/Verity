// Verity: The Live Layer of the Physical World

// 1. Places Graph Dataset
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
            capacity: "Seats Available",
            wifi: "Wi-Fi Working",
            payment: "Card Accepted"
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
        ],
        connections: [
            { targetId: "p5", name: "Metro Exit 3", category: "Metro", relation: "adjacent" },
            { targetId: "p6", name: "EV Station - Block 4", category: "EV Charger", relation: "100m away" }
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
            capacity: "Moderate Crowd",
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
            { time: "8:05 AM", text: "Security lines moving fast", positive: true },
            { time: "10:30 AM", text: "Terminal check-ins normal", positive: true }
        ],
        connections: [
            { targetId: "p7", name: "Airport Taxi Stand", category: "Taxi", relation: "directly connected" },
            { targetId: "p8", name: "Airport Metro Station", category: "Metro", relation: "directly connected" },
            { targetId: "p9", name: "Airport Parking Lot B", category: "Parking", relation: "directly connected" }
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
            parking: "Parking Available",
            pharmacy: "Pharmacy Open"
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
        ],
        connections: [
            { targetId: "p11", name: "Hospital Pharmacy", category: "Pharmacy", relation: "adjacent" }
        ]
    }
];

// Graph registry lookup
let graphRegistry = {
    "p5": { name: "Metro Exit 3", category: "Metro", status: "RUNNING" },
    "p6": { name: "EV Station - Block 4", category: "EV Charger", status: "2 AVAILABLE" },
    "p7": { name: "Airport Taxi Stand", category: "Taxi", status: "4 MIN WAIT" },
    "p8": { name: "Airport Metro Station", category: "Metro", status: "RUNNING" },
    "p9": { name: "Airport Parking Lot B", category: "Parking", status: "65% OCCUPIED" },
    "p11": { name: "Hospital Pharmacy", category: "Pharmacy", status: "OPEN" }
};

// Max 4 Options Checklist context updates
const updateOptions = {
    "Cafe": ["WiFi Down", "No Seats", "AC Not Working", "Closed"],
    "Airport": ["Terminal Closed", "Taxi Delay", "Parking Full", "Security Delay"],
    "Hospital": ["Emergency Unit Closed", "Wait > 40 min", "Parking Full", "Pharmacy Closed"],
    "ATM": ["Out of Cash", "Card Slot Broken", "Offline", "Queue"]
};

// Trust Signal and level configuration
let veritySignal = 18420;
let userStreak = 28;
let peopleHelped = 42184;

// Civic leaderboard mock dataset
const leaderboardData = [
    { rank: 1, name: "glassatlas", level: "Lattice", signal: 24180, ring: "Aurora" },
    { rank: 2, name: "stilltrue", level: "Vector", signal: 19420, ring: "Crystal" },
    { rank: 3, name: "dhiv_sentinel", level: "Prism", signal: 18420, ring: "Polar" },
    { rank: 4, name: "northsignal", level: "Pulse", signal: 14800, ring: "Normal" },
    { rank: 5, name: "quietpulse", level: "Trace", signal: 11200, ring: "Normal" }
];

// Rotated weekly titles
const weeklyTitles = [
    "Reality Report",
    "Your Weekly Impact",
    "This Week in Verity",
    "Community Reflection",
    "Keeping Places Accurate"
];
let currentTitleIndex = 0;

let map;
let markers = {};
let selectedPlaceId = "p1";
let pendingLat = 37.7749;
let pendingLng = -122.4194;

window.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupEvents();
    startDecayEngine();
    renderLeaderboard();
    
    // Hide passive geofence banner by default until simulated
    document.getElementById('passive-verification-banner').style.display = 'none';
});

function initMap() {
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([37.7749, -122.4194], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}{d}.png', {
        maxZoom: 20
    }).addTo(map);

    map.on('click', (e) => {
        openReportModal(e.latlng.lat, e.latlng.lng);
    });

    renderAll();
}

function startDecayEngine() {
    setInterval(() => {
        let changed = false;
        places.forEach((p) => {
            const elapsedMinutes = (Date.now() - p.lastVerified) / (60 * 1000);
            const lambda = Math.log(2) / p.halfLife;
            const multiplier = 3.0;
            const newConfidence = 100 * Math.exp(-lambda * elapsedMinutes * multiplier);

            if (newConfidence <= 10.0) {
                p.confidence = 0;
                changed = true;
            } else {
                if (Math.abs(p.confidence - newConfidence) > 0.1) {
                    p.confidence = newConfidence;
                    changed = true;
                }
            }
        });

        if (changed) {
            updateUI();
            updateSDKPayloadViewer();
        }
    }, 1000);
}

function getPlaceHealth(p) {
    const c = p.confidence;
    const minutesAgo = Math.max(1, Math.round((Date.now() - p.lastVerified) / 60000));
    
    if (c <= 10.0) {
        return {
            statusLabel: "Needs Fresh Check",
            desc: "Were you recently here? Confirm live details.",
            colorClass: "dot-grey",
            hexColor: "#6b7280",
            badge: "⚫ AWAITING CHECK",
            isStale: true
        };
    }

    if (c >= 15 && c < 75) {
        return {
            statusLabel: "Needs Attention",
            desc: "Status changes recently reported. Verify current truth.",
            colorClass: "dot-yellow",
            hexColor: "#f59e0b",
            badge: "🟡 CHECKING",
            isStale: false
        };
    }

    return {
        statusLabel: "Healthy",
        desc: `Everything recently confirmed. Last community check ${minutesAgo} min ago.`,
        colorClass: "dot-green",
        hexColor: "#10b981",
        badge: "🟢 HEALTHY",
        isStale: false
    };
}

function updateMarkers() {
    places.forEach(p => {
        const health = getPlaceHealth(p);
        const iconHtml = `
            <div class="marker-pin glass" style="background: rgba(13, 17, 30, 0.7); border-color: ${health.hexColor}44;">
                <div class="marker-pulse ${health.colorClass}"></div>
                <span style="color: ${health.hexColor}; font-size: 10px;">★</span>
            </div>
        `;

        const customIcon = L.divIcon({
            html: iconHtml,
            className: 'pulse-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
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
    updateUI();
    updateSDKPayloadViewer();
}

function updateSDKPayloadViewer() {
    const p = places.find(item => item.id === selectedPlaceId);
    if (!p) return;

    const health = getPlaceHealth(p);

    const payload = {
        "place_id": p.id,
        "name": p.name,
        "category": p.category,
        "health": {
            "status": health.statusLabel,
            "description": health.desc,
            "confidence_score": Math.round(p.confidence)
        },
        "now": p.capabilities,
        "recent": p.timeline,
        "usually": {
            "reliability_30_days": p.memoryStats.reliability,
            "patterns": p.patterns
        },
        "memory_stats": p.memoryStats,
        "connected_graph": p.connections.map(c => {
            const reg = graphRegistry[c.targetId] || {};
            return {
                "name": c.name,
                "category": c.category,
                "live_status": reg.status || "UNKNOWN"
            };
        })
    };

    document.getElementById('sdk-payload-code').textContent = JSON.stringify(payload, null, 2);
}

function updateUI() {
    const feed = document.getElementById('reports-feed');
    const activeCountSpan = document.getElementById('stat-active-count');
    
    activeCountSpan.textContent = places.length;

    feed.innerHTML = places.map(p => {
        const health = getPlaceHealth(p);
        const opacity = Math.max(0.4, p.confidence / 100);
        const isSelected = selectedPlaceId === p.id ? 'selected' : '';
        
        // NOW section
        let nowHtml = `<div style="margin-bottom: 8px;">`;
        Object.keys(p.capabilities).forEach(key => {
            const val = p.capabilities[key];
            if (val) nowHtml += ` • <strong>${val}</strong>`;
        });
        nowHtml += `</div>`;

        // RECENT timeline
        let recentHtml = `<div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; border-left: 2px solid var(--primary); padding-left: 8px;">`;
        p.timeline.slice(0, 3).forEach(t => {
            recentHtml += `<strong>${t.time}</strong> — ${t.text}<br/>`;
        });
        recentHtml += `</div>`;

        // USUALLY
        let usuallyHtml = `<div style="font-size: 11px; margin-bottom: 8px;">`;
        usuallyHtml += `Reliability: <span class="fact-yes">${p.memoryStats.reliability}</span><br/>`;
        p.patterns.forEach(pat => {
            usuallyHtml += `• ${pat}<br/>`;
        });
        usuallyHtml += `</div>`;

        // Place Memory Stats card
        let memoryHtml = `
            <div class="place-memory-box">
                <div style="font-weight:700; color: var(--text-secondary); text-transform:uppercase; font-size: 8px; margin-bottom: 4px;">Universal Place Memory</div>
                ⚡ <strong>${p.memoryStats.totalUpdates}</strong> confirmations this month • 📅 Open <strong>${p.memoryStats.activeDays}</strong> Days • ⏰ Peak: <strong>${p.memoryStats.peakCrowdTime}</strong>
            </div>
        `;

        // Connected graph relations
        let connectionsHtml = "";
        if (p.connections && p.connections.length > 0) {
            connectionsHtml += `<div class="relations-title">Neighborhood Context</div><div class="relations-grid">`;
            p.connections.forEach(c => {
                const reg = graphRegistry[c.targetId] || { status: "UNKNOWN" };
                connectionsHtml += `
                    <div class="relation-chip">
                        <span>🔗</span>
                        <div>
                            <strong>${c.name}</strong>
                            <div style="font-size: 8px; color: var(--accent);">${reg.status}</div>
                        </div>
                    </div>
                `;
            });
            connectionsHtml += `</div>`;
        }

        // Checklist for Update Status (Limit max 4 options checklist)
        const options = updateOptions[p.category] || ["Closed", "Offline"];
        const checkboxesHtml = options.slice(0, 4).map((opt) => `
            <label class="checkbox-row">
                <input type="checkbox" name="corrections" value="${opt}">
                <span>${opt}</span>
            </label>
        `).join('');

        return `
            <div class="report-card ${isSelected}" id="card-${p.id}" onclick="selectPlace('${p.id}')" style="opacity: ${opacity}">
                <div class="card-header">
                    <span class="category-tag">${p.category} — ${p.name}</span>
                    <div class="confidence-indicator">
                        <span class="confidence-dot ${health.colorClass}"></span>
                        <span>${health.badge}</span>
                    </div>
                </div>

                <!-- Place Health Header -->
                <div style="margin: 8px 0; padding: 12px; background: rgba(255,255,255,0.01); border-radius: 12px; border-left: 2px solid ${health.hexColor}; border: 1px solid rgba(255,255,255,0.02);">
                    <div style="font-weight: 700; font-size: 13px; color: ${health.hexColor};">${health.statusLabel}</div>
                    <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${health.desc}</div>
                </div>

                <!-- Stale Data Handling -->
                ${health.isStale ? `
                    <div style="padding: 16px; border: 1px dashed rgba(255,255,255,0.06); border-radius: 12px; text-align: center; font-size: 11px; margin: 12px 0; color: var(--text-secondary);">
                        No recent updates. Tapping looks good helps keep this place healthy.
                    </div>
                ` : `
                    <div class="section-title">NOW</div>
                    ${nowHtml}

                    <div class="section-title">RECENT</div>
                    ${recentHtml}

                    <div class="section-title">USUALLY</div>
                    ${usuallyHtml}
                `}

                ${memoryHtml}
                ${connectionsHtml}



                <!-- Definitive Verification Flow -->
                <div class="verification-core-box">
                    <span class="verification-heading">Is this still accurate?</span>
                    <!-- Centered Large Green Glass button -->
                    <button class="looks-good-btn" onclick="verifyLooksGood('${p.id}', event)">✓ Looks Good</button>
                    <!-- Subtle "Something changed?" links -->
                    <button class="update-status-link" onclick="toggleCorrectionConsole('${p.id}', event)">Something changed?</button>
                    
                    <!-- Reality check list editor -->
                    <div class="reality-check-console" id="editor-${p.id}">
                        <div style="font-weight:700; font-size: 9px; margin-bottom: 6px; color: var(--state-issue); letter-spacing: 0.5px;">SELECT WHAT CHANGED:</div>
                        ${checkboxesHtml}
                        <label class="checkbox-row">
                            <input type="checkbox" id="chk-other-${p.id}" onchange="toggleOtherText('${p.id}')">
                            <span>Other</span>
                        </label>
                        <input type="text" id="txt-other-${p.id}" class="other-note-input" placeholder="Optional details (max 100 chars)" maxlength="100" style="display:none;">
                        <button class="submit-corrections-btn" onclick="submitCorrections('${p.id}', event)">Submit corrections</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    updateMarkers();
}

function verifyLooksGood(id, event) {
    if (event) event.stopPropagation();

    const place = places.find(p => p.id === id);
    if (!place) return;

    place.confidence = 100.0;
    place.lastVerified = Date.now();

    // Reward Verity Signal instead of XP
    veritySignal += 10;
    document.getElementById('user-truth-score').textContent = `◉ ${veritySignal.toLocaleString()} Signal`;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    place.timeline.unshift({ time: timeStr, text: "Verified active state", positive: true });
    place.memoryStats.totalUpdates += 1;

    updateUI();
    updateSDKPayloadViewer();
}

function toggleCorrectionConsole(id, event) {
    if (event) event.stopPropagation();
    const card = document.getElementById(`card-${id}`);
    if (card) {
        card.classList.toggle('editor-open');
    }
}

function toggleOtherText(id) {
    const chk = document.getElementById(`chk-other-${id}`);
    const txt = document.getElementById(`txt-other-${id}`);
    txt.style.display = chk.checked ? 'block' : 'none';
}

function submitCorrections(id, event) {
    if (event) event.stopPropagation();

    const place = places.find(p => p.id === id);
    if (!place) return;

    const editor = document.getElementById(`editor-${id}`);
    const selectedCheckboxes = editor.querySelectorAll('input[name="corrections"]:checked');
    const chkOther = document.getElementById(`chk-other-${id}`);
    const txtOther = document.getElementById(`txt-other-${id}`);

    let changes = [];
    selectedCheckboxes.forEach(cb => {
        changes.push(cb.value);
        if (cb.value.includes("WiFi")) place.capabilities.wifi = "WiFi Offline";
        if (cb.value.includes("Seats")) place.capabilities.capacity = "No Seats";
        if (cb.value.includes("Closed")) place.capabilities.operational = "CLOSED";
        if (cb.value.includes("Out of Cash")) place.capabilities.capacity = "No Cash";
    });

    if (chkOther.checked && txtOther.value.trim() !== "") {
        changes.push(txtOther.value.trim());
    }

    if (changes.length === 0) {
        alert("Please select at least one status option.");
        return;
    }

    place.confidence = 100.0;
    place.lastVerified = Date.now();

    // Verified Correction rewards 25 Signal
    veritySignal += 25;
    document.getElementById('user-truth-score').textContent = `◉ ${veritySignal.toLocaleString()} Signal`;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    place.timeline.unshift({ time: timeStr, text: `Corrected: ${changes.join(', ')}`, positive: false });
    place.memoryStats.totalUpdates += 1;

    const card = document.getElementById(`card-${id}`);
    if (card) card.classList.remove('editor-open');

    updateUI();
    updateSDKPayloadViewer();
}

// Exit Simulation uses rotated weekly titles with clean impact summaries
function triggerExitSimulation() {
    const banner = document.getElementById('passive-verification-banner');
    const text = document.getElementById('passive-banner-text');

    currentTitleIndex = (currentTitleIndex + 1) % weeklyTitles.length;
    const title = weeklyTitles[currentTitleIndex];

    text.innerHTML = `
        <div style="font-size:9px; font-weight:700; color:var(--state-healthy); letter-spacing: 0.5px; text-transform: uppercase;">${title}</div>
        <strong>SF International Airport: Everything still looks right?</strong>
    `;
    
    map.panTo([37.7833, -122.4167]);
    selectPlace("p2");

    banner.style.display = 'flex';
}

function respondPassiveVerify(isPositive) {
    const banner = document.getElementById('passive-verification-banner');
    banner.style.display = 'none';

    const place = places.find(p => p.id === "p2");
    if (!place) return;

    place.confidence = isPositive ? 100.0 : Math.max(0, place.confidence - 30.0);
    place.lastVerified = Date.now();

    veritySignal += 10;
    document.getElementById('user-truth-score').textContent = `◉ ${veritySignal.toLocaleString()} Signal`;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    place.timeline.unshift({ time: timeStr, text: isPositive ? "Verified SFO status on Geofence exit" : "Exited SFO: changes reported", positive: isPositive });
    
    updateUI();
    updateSDKPayloadViewer();
}

function searchQuery(txt) {
    document.getElementById('conversational-search').value = txt;
    triggerSearch();
}

// Render Civic Leaderboard with prestige Glass Rings
function renderLeaderboard() {
    const ranksList = document.getElementById('leaderboard-list');
    if (!ranksList) return;

    // Sort mock data
    leaderboardData.sort((a, b) => b.signal - a.signal);

    ranksList.innerHTML = leaderboardData.map(user => {
        const ringClass = `avatar-ring${user.ring}`;
        return `
            <div class="leaderboard-row">
                <div class="leaderboard-left">
                    <span class="leaderboard-rank">#${user.rank}</span>
                    <div class="${ringClass}" style="width: 32px; height: 32px;">
                        <div class="avatar" style="background: rgba(255,255,255,0.05); width: 26px; height: 26px; border-radius: 50%; font-size: 8px; font-weight: bold; display: flex; align-items: center; justify-content: center; color: #fff;">
                            ${user.name.substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                    <div>
                        <strong style="display: block;">@${user.name}</strong>
                        <span style="font-size: 9px; color: var(--text-tertiary);">${user.level}</span>
                    </div>
                </div>
                <div class="leaderboard-right">
                    <strong>◉ ${user.signal.toLocaleString()}</strong>
                    <div style="font-size: 8px; color: var(--text-tertiary);">Signal</div>
                </div>
            </div>
        `;
    }).join('');
}

// Tab switcher logic for sidebar panels
function switchSidebarTab(panelName, element) {
    // 1. Hide all panels
    const panels = document.querySelectorAll('.sidebar-panel-content');
    panels.forEach(p => p.style.display = 'none');

    // 2. Show selected panel
    const selectedPanel = document.getElementById(`panel-${panelName}`);
    if (selectedPanel) selectedPanel.style.display = 'block';

    // 3. Set active classes on dock icons
    const dockItems = document.querySelectorAll('.dock-item');
    dockItems.forEach(item => item.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    }
}

function quickReport(category) {
    const names = {
        "ATM Cash": "Hub ATM",
        "ATM Offline": "Hub ATM",
        "Flood": "East Expressway Link",
        "Power Outage": "Sub-Station 4"
    };

    const newPlace = {
        id: 'p_' + Date.now(),
        name: names[category] || "New Spot Hub",
        category: category.includes("ATM") ? "ATM" : category,
        locationDesc: "Registered near coordinates",
        lat: 37.7749 + (Math.random() - 0.5) * 0.01,
        lng: -122.4194 + (Math.random() - 0.5) * 0.01,
        confidence: 100,
        lastVerified: Date.now(),
        halfLife: 45,
        capabilities: {
            operational: category.includes("Offline") || category.includes("Outage") ? "OFFLINE" : "RUNNING_NORMALLY",
            capacity: "AVAILABLE"
        },
        memoryStats: {
            reliability: "100% reliable",
            totalUpdates: 1,
            activeDays: 1,
            peakCrowdTime: "12:00 PM"
        },
        patterns: ["Pattern learning active"],
        timeline: [
            { time: "Just Now", text: "Asset state initialized", positive: true }
        ],
        connections: []
    };

    places.push(newPlace);
    selectedPlaceId = newPlace.id;

    // Fresh Place Check rewards 15 Signal
    veritySignal += 15;
    document.getElementById('user-truth-score').textContent = `◉ ${veritySignal.toLocaleString()} Signal`;

    updateUI();
    updateSDKPayloadViewer();
}

function updateLivePulseHeader() {
    const pulseBadge = document.querySelector('.pulse-status-badge');
    const pulseSummary = document.querySelector('.pulse-summary');

    pulseBadge.textContent = "🟢 Everything Normal";
    pulseBadge.style.color = "var(--state-healthy)";
    pulseBadge.style.background = "rgba(16, 185, 129, 0.06)";
    pulseSummary.textContent = "SF Grid infrastructure stable • Recent checks confirmed all capabilities operational.";
}

function handleSearch(event) {
    if (event.key === 'Enter') {
        triggerSearch();
    }
}

function triggerSearch() {
    const query = document.getElementById('conversational-search').value.toLowerCase().trim();
    if (!query) return;

    const responseBox = document.getElementById('search-response-box');
    const responseText = document.getElementById('search-response-text');

    let answer = "";

    if (query.includes('sfo') || query.includes('airport') || query.includes('terminal')) {
        const parent = places.find(p => p.category === 'Airport');
        answer = `
            <strong>SF International Airport Status</strong><br/>
            ✓ Terminal: <strong>${parent.capabilities.operational}</strong><br/>
            • Taxi wait time: <strong>4 min</strong><br/>
            • Metro train: <strong>Running</strong><br/>
            • Gate ATMs: <strong>3 dispensing cash</strong>
        `;
    } else if (query.includes('cafe') || query.includes('coffee') || query.includes('crowd')) {
        const cafe = places.find(p => p.category === 'Cafe');
        answer = `
            <strong>Brew Cafe Live State:</strong><br/>
            • Seating: <strong class="fact-yes">${cafe.capabilities.capacity}</strong><br/>
            • WiFi: <strong>${cafe.capabilities.wifi}</strong><br/>
            • Pattern: <em>Usually crowded after 6 PM</em>
        `;
    } else if (query.includes('hospital') || query.includes('er') || query.includes('wait')) {
        const hosp = places.find(p => p.category === 'Hospital');
        answer = `
            <strong>City Hospital ER Live State:</strong><br/>
            • Status: <strong class="fact-yes">${hosp.capabilities.operational}</strong><br/>
            • Wait time: <strong>${hosp.capabilities.capacity}</strong>
        `;
    } else {
        answer = `Scanned local graph. Try asking: <em>"Is SFO terminal running?"</em> or <em>"Is the cafe crowded?"</em>.`;
    }

    responseText.innerHTML = answer;
    responseBox.style.display = 'block';
}

function clearSearch() {
    document.getElementById('conversational-search').value = "";
    document.getElementById('search-response-box').style.display = 'none';
}

function openReportModal(lat, lng) {
    pendingLat = lat;
    pendingLng = lng;
    document.getElementById('report-modal').classList.add('open');
}

function closeReportModal() {
    document.getElementById('report-modal').classList.remove('open');
}

function setupEvents() {
    document.getElementById('btn-report-truth').addEventListener('click', () => {
        openReportModal(37.7749 + (Math.random() - 0.5) * 0.02, -122.4194 + (Math.random() - 0.5) * 0.02);
    });

    document.getElementById('new-report-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const cat = document.getElementById('report-category').value;
        const name = document.getElementById('report-note').value;

        const newPlace = {
            id: 'p_' + Date.now(),
            name: name,
            category: cat,
            locationDesc: "Registered custom node",
            lat: pendingLat,
            lng: pendingLng,
            confidence: 100,
            lastVerified: Date.now(),
            halfLife: 45,
            capabilities: {
                operational: "OPEN",
                capacity: "AVAILABLE"
            },
            memoryStats: {
                reliability: "100% reliable",
                totalUpdates: 1,
                activeDays: 1,
                peakCrowdTime: "3:00 PM"
            },
            patterns: ["Learning patterns..."],
            timeline: [
                { time: "Just Now", text: `Registered ${name}`, positive: true }
            ],
            connections: []
        };

        places.push(newPlace);
        selectedPlaceId = newPlace.id;
        closeReportModal();
        
        map.panTo([pendingLat, pendingLng]);
        renderAll();
        document.getElementById('new-report-form').reset();
    });
}

function renderAll() {
    updateUI();
    updateSDKPayloadViewer();
    updateLivePulseHeader();
}
