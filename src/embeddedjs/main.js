import Poco from "commodetto/Poco";

const render = new Poco(screen);
const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);
const blue = render.makeColor(0, 0, 255);
const font = new render.Font('Gothic-Regular', 14)
const fontBold = new render.Font('Gothic-Bold', 14)
const fontDate = new render.Font('Roboto-Condensed', 21)
const gray = render.makeColor(170, 170, 170)

function getHandAngles(now) {
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const minuteAngle = minutes * 6 + seconds * 0.1;
    const hourAngle = hours * 30 + minutes * 0.5;

    return {hourAngle, minuteAngle};
}

function toRadians(angle) {
    return (angle - 90) * Math.PI / 180;
}

function drawHand(cx, cy, angle, length, color, thickness) {
    const radians = toRadians(angle);
    const perpRad = radians + Math.PI / 2;

    // Proportions for Naos-style hand
    const shaftLength = length - 11;
    const halfThick = thickness / 2;

    // End of shaft (where tip begins)
    const shaftEndX = cx + Math.cos(radians) * shaftLength;
    const shaftEndY = cy + Math.sin(radians) * shaftLength;

    // Tip point
    const tipX = cx + Math.cos(radians) * length;
    const tipY = cy + Math.sin(radians) * length;

    // Draw shaft as simple thick line
    render.drawLine(cx, cy, shaftEndX, shaftEndY, color, thickness);

    // Draw tip as filled triangle using scanlines
    const tipBaseX1 = shaftEndX + Math.cos(perpRad) * halfThick;
    const tipBaseY1 = shaftEndY + Math.sin(perpRad) * halfThick;
    const tipBaseX2 = shaftEndX - Math.cos(perpRad) * halfThick;
    const tipBaseY2 = shaftEndY - Math.sin(perpRad) * halfThick;

    // Triangle points: base1, base2, tip
    const points = [
        {x: tipBaseX1, y: tipBaseY1},
        {x: tipBaseX2, y: tipBaseY2},
        {x: tipX, y: tipY}
    ];

    // Find bounding box of tip
    const minY = Math.min(tipBaseY1, tipBaseY2, tipY);
    const maxY = Math.max(tipBaseY1, tipBaseY2, tipY);

    // Fill triangle with horizontal scanlines
    const steps = Math.ceil(maxY - minY);
    for (let i = 0; i <= steps; i++) {
        const y = minY + i;
        if (y < 0 || y >= render.height) continue;

        // Find intersections with triangle edges
        const intersections = [];
        for (let j = 0; j < 3; j++) {
            const p1 = points[j];
            const p2 = points[(j + 1) % 3];

            // Check if edge crosses this y
            if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
                // Calculate intersection x
                const t = (y - p1.y) / (p2.y - p1.y);
                const x = p1.x + t * (p2.x - p1.x);
                intersections.push(x);
            }
        }

        // Draw line between intersection points
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

// Draw tick marks - further inside (Naos style)
function drawTicks(cx, cy, radius) {
    for (let i = 0; i < 60; i++) {
        let tickRadius = radius * 0.8;
        const angle = i * 6;
        const radians = toRadians(angle);

        const isOddHour = i % 5 === 0 && i % 10 !== 0;
        const isEvenHour = i % 5 === 0 && i % 10 === 0;
        const is6Hour = i === 30;
        let tickLength = 6
        if (is6Hour) {
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

        render.drawLine(x1, y1, x2, y2, black, tickThickness);
    }
}

// Draw numbers outside the ticks (Naos style) - UPRIGHT/Horizontal
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

        render.drawText(numStr, font, black, x - width / 2, y - font.height / 2)
    }
}

function drawBranding() {
    const msg = "P E B B L E";
    const width = render.getTextWidth(msg, fontBold);
    const x = (render.width - width) / 2;
    const y = 70
    render.drawText(msg, fontBold, black, x, y)
}

// Draw date at 6 o'clock position with frame shadow
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

    const shadowColor = gray;

    // Top shadow
    render.fillRectangle(shadowColor, boxX, boxY, boxWidth, 6);
    // Right shadow
    render.fillRectangle(shadowColor, boxX + boxWidth - 3, boxY, 3, boxHeight);
    // Bottom shadow
    render.fillRectangle(shadowColor, boxX, boxY + boxHeight - 1, boxWidth, 1);
    // Left shadow
    render.fillRectangle(shadowColor, boxX, boxY, 1, boxHeight);

    // Draw day number centered
    render.drawText(dayStr, fontDate, black, cx - textWidth / 2, dateY - fontDate.height / 2);
}

function drawAnalogClock(e) {
    const cx = render.width / 2;
    const cy = render.height / 2;
    const radius = Math.min(cx, cy) - 2;

    const {hourAngle, minuteAngle} = getHandAngles(e.date);

    render.begin();
    render.fillRectangle(white, 0, 0, render.width, render.height);

    drawTicks(cx, cy, radius);
    drawNumbers(cx, cy, radius);
    drawDate(cx, cy, radius, e.date);

    drawBranding();

    drawHand(cx, cy, hourAngle, radius * 0.65, blue, 5);
    drawHand(cx, cy, minuteAngle, radius * 0.95, blue, 5);

    render.drawCircle(blue, cx, cy, 7, 0, 360);

    render.end();
}

watch.addEventListener("minutechange", drawAnalogClock);
