import Poco from "commodetto/Poco";
import Message from "pebble/message";

const render = new Poco(screen);
const font = new render.Font('Gothic-Regular', 14)
const fontBold = new render.Font('Gothic-Bold', 14)
const fontDate = new render.Font('Roboto-Condensed', 21)

// Theme-Definitionen
const themes = {
    0: { // Classic
        background: render.makeColor(255, 255, 255),
        foreground: render.makeColor(0, 0, 0),
        accent: render.makeColor(0, 0, 170),
        shadow: render.makeColor(170, 170, 170),
        handShadow: render.makeColor(170, 170, 170)
    },
    1: { // Black
        background: render.makeColor(0, 0, 0),
        foreground: render.makeColor(255, 255, 255),
        accent: render.makeColor(255, 255, 255),
        shadow: render.makeColor(85, 85, 85),
        handShadow: null
    },
    2: { // Forest
        background: render.makeColor(0, 85, 85),
        foreground: render.makeColor(255, 255, 255),
        accent: render.makeColor(170, 85, 0),
        shadow: render.makeColor(0, 0, 0),
        handShadow: render.makeColor(85, 85, 85)
    },
    3: { // Pastel
        background: render.makeColor(255, 255, 170),
        foreground: render.makeColor(0, 0, 0),
        accent: render.makeColor(85, 0, 0),
        shadow: render.makeColor(170, 170, 170),
        handShadow: render.makeColor(170, 170, 170)
    },
    4: { // Blue
        background: render.makeColor(0, 0, 170),
        foreground: render.makeColor(255, 255, 255),
        accent: render.makeColor(170, 170, 170),
        shadow: render.makeColor(0, 0, 0),
        handShadow: render.makeColor(0, 0, 0)
    },
    5: { // Rose
        background: render.makeColor(85, 0, 0),
        foreground: render.makeColor(255, 255, 255),
        accent: render.makeColor(255, 170, 170),
        shadow: render.makeColor(0, 0, 0),
        handShadow: render.makeColor(0, 0, 0)
    }
};

// Aktuelles Theme laden (persistiert)
let currentTheme = themes[0];
let currentThemeId = 0;

// Optionen (persistiert)
let showBranding = true;
let showDate = true;
let showSeconds = false;

function loadSettings() {
    try {
        const savedTheme = localStorage.getItem('naos_theme');
        if (savedTheme !== null && themes[savedTheme]) {
            currentThemeId = parseInt(savedTheme);
            currentTheme = themes[currentThemeId];
        }

        const savedBranding = localStorage.getItem('naos_branding');
        if (savedBranding !== null) showBranding = savedBranding === '1';

        const savedDate = localStorage.getItem('naos_date');
        if (savedDate !== null) showDate = savedDate === '1';

        const savedSeconds = localStorage.getItem('naos_seconds');
        if (savedSeconds !== null) showSeconds = savedSeconds === '1';
    } catch (e) {
        // Silent fail
    }
}

loadSettings();

// Message API für Konfiguration vom Phone
const message = new Message({
    keys: ["Theme", "ShowBranding", "ShowDate", "ShowSeconds"],
    onReadable() {
        const msg = this.read();
        let needsRedraw = false;

        const themeId = msg.get("Theme");
        if (themeId !== undefined && themes[themeId]) {
            currentThemeId = parseInt(themeId);
            currentTheme = themes[currentThemeId];
            try {
                localStorage.setItem('naos_theme', currentThemeId.toString());
            } catch (e) {
            }
            needsRedraw = true;
        }

        const branding = msg.get("ShowBranding");
        if (branding !== undefined) {
            showBranding = branding === 1;
            try {
                localStorage.setItem('naos_branding', showBranding ? '1' : '0');
            } catch (e) {
            }
            needsRedraw = true;
        }

        const date = msg.get("ShowDate");
        if (date !== undefined) {
            showDate = date === 1;
            try {
                localStorage.setItem('naos_date', showDate ? '1' : '0');
            } catch (e) {
            }
            needsRedraw = true;
        }

        const seconds = msg.get("ShowSeconds");
        if (seconds !== undefined) {
            showSeconds = seconds === 1;
            try {
                localStorage.setItem('naos_seconds', showSeconds ? '1' : '0');
            } catch (e) {
            }
            updateTimeEventListener();
            needsRedraw = true;
        }

        if (needsRedraw) {
            const now = new Date();
            drawAnalogClock({date: now});
        }
    },
    onWritable() {
    },
    onSuspend() {
    }
});

function getHandAngles(now) {
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const secondAngle = seconds * 6;
    const minuteAngle = minutes * 6 + seconds * 0.1;
    const hourAngle = hours * 30 + minutes * 0.5;

    return {hourAngle, minuteAngle, secondAngle};
}

function toRadians(angle) {
    return (angle - 90) * Math.PI / 180;
}

function drawHandShadow(cx, cy, angle, length, thickness, shadowOffset, tipLength) {
    if (shadowOffset <= 0) return;
    if (currentTheme.handShadow === null) return;
    
    const radians = toRadians(angle);
    const perpRad = radians + Math.PI / 2;

    const shaftLength = length - tipLength;
    const halfThick = thickness / 2;

    const shaftEndX = cx + Math.cos(radians) * shaftLength;
    const shaftEndY = cy + Math.sin(radians) * shaftLength;

    const tipX = cx + Math.cos(radians) * length;
    const tipY = cy + Math.sin(radians) * length;

    const shadowX = -shadowOffset;
    const shadowY = shadowOffset;

    render.drawLine(cx + shadowX, cy + shadowY, shaftEndX + shadowX, shaftEndY + shadowY, currentTheme.handShadow, thickness);

    const tipBaseX1 = shaftEndX + Math.cos(perpRad) * halfThick;
    const tipBaseY1 = shaftEndY + Math.sin(perpRad) * halfThick;
    const tipBaseX2 = shaftEndX - Math.cos(perpRad) * halfThick;
    const tipBaseY2 = shaftEndY - Math.sin(perpRad) * halfThick;

    const shadowPoints = [
        {x: tipBaseX1 + shadowX, y: tipBaseY1 + shadowY},
        {x: tipBaseX2 + shadowX, y: tipBaseY2 + shadowY},
        {x: tipX + shadowX, y: tipY + shadowY}
    ];

    const minY = Math.min(shadowPoints[0].y, shadowPoints[1].y, shadowPoints[2].y);
    const maxY = Math.max(shadowPoints[0].y, shadowPoints[1].y, shadowPoints[2].y);

    const steps = Math.ceil(maxY - minY);
    for (let i = 0; i <= steps; i++) {
        const y = minY + i;
        if (y < 0 || y >= render.height) continue;

        const intersections = [];
        for (let j = 0; j < 3; j++) {
            const p1 = shadowPoints[j];
            const p2 = shadowPoints[(j + 1) % 3];

            if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
                const t = (y - p1.y) / (p2.y - p1.y);
                const x = p1.x + t * (p2.x - p1.x);
                intersections.push(x);
            }
        }

        if (intersections.length >= 2) {
            intersections.sort((a, b) => a - b);
            const x1 = Math.max(0, intersections[0]);
            const x2 = Math.min(render.width, intersections[1]);
            if (x2 > x1) {
                render.drawLine(x1, y, x2, y, currentTheme.handShadow, 1);
            }
        }
    }
}

function drawHand(cx, cy, angle, length, color, thickness, tipLength) {
    const radians = toRadians(angle);
    const perpRad = radians + Math.PI / 2;

    const shaftLength = length - tipLength;
    const halfThick = thickness / 2;

    const shaftEndX = cx + Math.cos(radians) * shaftLength;
    const shaftEndY = cy + Math.sin(radians) * shaftLength;

    const tipX = cx + Math.cos(radians) * length;
    const tipY = cy + Math.sin(radians) * length;

    // Zeichne Schaft
    render.drawLine(cx, cy, shaftEndX, shaftEndY, color, thickness);

    // Zeichne Spitze als Dreieck
    const tipBaseX1 = shaftEndX + Math.cos(perpRad) * halfThick;
    const tipBaseY1 = shaftEndY + Math.sin(perpRad) * halfThick;
    const tipBaseX2 = shaftEndX - Math.cos(perpRad) * halfThick;
    const tipBaseY2 = shaftEndY - Math.sin(perpRad) * halfThick;

    const points = [
        {x: tipBaseX1, y: tipBaseY1},
        {x: tipBaseX2, y: tipBaseY2},
        {x: tipX, y: tipY}
    ];

    const minY = Math.min(tipBaseY1, tipBaseY2, tipY);
    const maxY = Math.max(tipBaseY1, tipBaseY2, tipY);

    const steps = Math.ceil(maxY - minY);
    for (let i = 0; i <= steps; i++) {
        const y = minY + i;
        if (y < 0 || y >= render.height) continue;

        const intersections = [];
        for (let j = 0; j < 3; j++) {
            const p1 = points[j];
            const p2 = points[(j + 1) % 3];

            if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
                const t = (y - p1.y) / (p2.y - p1.y);
                const x = p1.x + t * (p2.x - p1.x);
                intersections.push(x);
            }
        }

        if (intersections.length >= 2) {
            intersections.sort((a, b) => a - b);
            const x1 = Math.max(0, intersections[0]);
            const x2 = Math.min(render.width, intersections[1]);
            if (x2 > x1) {
                render.drawLine(x1, y, x2, y, color, 1);
            }
        }
    }
}

function drawTicks(cx, cy, radius) {
    for (let i = 0; i < 60; i++) {
        let tickRadius = radius * 0.8;
        const angle = i * 6;
        const radians = toRadians(angle);

        const isOddHour = i % 5 === 0 && i % 10 !== 0;
        const isEvenHour = i % 5 === 0 && i % 10 === 0;
        const is6Hour = i === 30;
        let tickLength = 6
        if (showDate && is6Hour) {
            tickLength = 10;
        } else if (isEvenHour) {
            tickLength = 13;
        } else if (isOddHour) {
            tickLength = render.width * 0.12;
            tickRadius = radius * 0.92;
        }
        const tickThickness = 1;

        const innerR = tickRadius - tickLength;
        const outerR = tickRadius;

        const x1 = cx + Math.cos(radians) * innerR;
        const y1 = cy + Math.sin(radians) * innerR;
        const x2 = cx + Math.cos(radians) * outerR;
        const y2 = cy + Math.sin(radians) * outerR;

        render.drawLine(x1, y1, x2, y2, currentTheme.foreground, tickThickness);
    }
}

function drawNumbers(cx, cy, radius) {
    const positions = [
        {num: 12, angle: 0},
        {num: 2, angle: 60},
        {num: 4, angle: 120},
        {num: 6, angle: 180},
        {num: 8, angle: 240},
        {num: 10, angle: 300}
    ];

    const numRadius = radius * 0.92;

    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const radians = toRadians(pos.angle);
        const x = cx + Math.cos(radians) * numRadius;
        const y = cy + Math.sin(radians) * numRadius;

        const numStr = pos.num.toString().padStart(2, '0');
        const width = render.getTextWidth(numStr, font);

        render.drawText(numStr, font, currentTheme.foreground, x - width / 2, y - font.height / 2)
    }
}

function drawBranding(radius) {
    const msg = "P E B B L E";
    const width = render.getTextWidth(msg, fontBold);
    const x = (render.width - width) / 2;
    const y = (render.height - (radius - 13)) / 2
    render.drawText(msg, fontBold, currentTheme.foreground, x, y)
}

function drawDate(cx, cy, radius, date) {
    const day = date.getDate();
    const dayStr = day.toString();

    const textWidth = render.getTextWidth(dayStr, fontDate);
    const padding = 4;
    const boxWidth = textWidth + padding;
    const boxHeight = fontDate.height + padding;
    const dateY = (cy + Math.sin(toRadians(180)) * radius * 0.8) - boxHeight;
    const boxX = cx - boxWidth / 2;
    const boxY = dateY - boxHeight / 2;

    render.fillRectangle(currentTheme.shadow, boxX, boxY, boxWidth, 6);
    render.fillRectangle(currentTheme.shadow, boxX + boxWidth - 3, boxY, 3, boxHeight);
    render.fillRectangle(currentTheme.shadow, boxX, boxY + boxHeight - 1, boxWidth, 1);
    render.fillRectangle(currentTheme.shadow, boxX, boxY, 1, boxHeight);

    render.drawText(dayStr, fontDate, currentTheme.foreground, cx - textWidth / 2, dateY - fontDate.height / 2);
}

function drawAnalogClock(e) {
    const cx = render.width / 2;
    const cy = render.height / 2;
    const radius = Math.min(cx, cy) - 2;

    const {hourAngle, minuteAngle, secondAngle} = getHandAngles(e.date);

    render.begin();
    render.fillRectangle(currentTheme.background, 0, 0, render.width, render.height);

    drawTicks(cx, cy, radius);
    drawNumbers(cx, cy, radius);

    if (showDate) drawDate(cx, cy, radius, e.date);
    if (showBranding) drawBranding(radius);

    // 1. ALLE Schatten zuerst zeichnen
    drawHandShadow(cx, cy, hourAngle, radius * 0.65, 5, 2, 11);
    drawHandShadow(cx, cy, minuteAngle, radius * 0.95, 5, 3, 11);
    if (showSeconds) {
        drawHandShadow(cx, cy, secondAngle, radius * 0.95, 2, 3, 6);
    }
    // Mittelpunkt-Schatten
    if (currentTheme.handShadow !== null) {
        render.drawCircle(currentTheme.handShadow, cx - 2, cy + 2, 7, 0, 360);
    }

    // 2. DANN ALLE Zeiger zeichnen
    drawHand(cx, cy, hourAngle, radius * 0.65, currentTheme.accent, 5, 11);
    drawHand(cx, cy, minuteAngle, radius * 0.95, currentTheme.accent, 5, 11);
    if (showSeconds) {
        drawHand(cx, cy, secondAngle, radius * 0.95, currentTheme.accent, 2, 6);
    }
    // Mittelpunkt
    render.drawCircle(currentTheme.accent, cx, cy, 7, 0, 360);

    render.end();
}

// Event Listener für Zeit-Updates
let currentEventListener = null;

function updateTimeEventListener() {
    // Entferne alten Listener falls vorhanden
    if (currentEventListener) {
        watch.removeEventListener(currentEventListener.type, currentEventListener.handler);
        currentEventListener = null;
    }

    // Wähle Event-Typ basierend auf Sekundenzeiger-Einstellung
    const eventType = showSeconds ? "secondchange" : "minutechange";

    const handler = function (e) {
        drawAnalogClock(e);
    };

    watch.addEventListener(eventType, handler);
    currentEventListener = {type: eventType, handler: handler};
}

// Initiales Zeichnen und Event-Listener setzen
const now = new Date();
drawAnalogClock({date: now});
updateTimeEventListener();
