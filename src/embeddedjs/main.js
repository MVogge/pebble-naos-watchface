import Poco from "commodetto/Poco";

const render = new Poco(screen);
const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);
const blue = render.makeColor(0, 0, 255);

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
    const endX = cx + Math.cos(radians) * length;
    const endY = cy + Math.sin(radians) * length;
    render.drawLine(cx, cy, endX, endY, color, thickness);
}

// Draw tick marks - further inside (Naos style)
function drawTicks(cx, cy, radius) {
    for (let i = 0; i < 60; i++) {
        let tickRadius = radius * 0.8;
        const angle = i * 6;
        const radians = toRadians(angle);

        const isOddHour = i % 5 === 0 && i % 10 !== 0;
        const isEvenHour = i % 5 === 0 && i % 10 === 0;
        let tickLength = 6
        if (isEvenHour) {
            tickLength = 13;
        } else if (isOddHour) {
            tickLength = 30;
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

// Draw simple digit using rectangles (horizontal/upright)
function drawDigit(x, y, digit, color) {
    const patterns = {
        0: [[0, 1, 0], [1, 0, 1], [1, 0, 1], [1, 0, 1], [0, 1, 0]],
        1: [[0, 1, 0], [1, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]],
        2: [[1, 1, 0], [0, 0, 1], [0, 1, 0], [1, 0, 0], [1, 1, 1]],
        4: [[0, 1, 0], [0, 1, 0], [1, 0, 1], [1, 1, 1], [0, 0, 1]],
        6: [[0, 1, 1], [1, 0, 0], [1, 1, 1], [1, 0, 1], [1, 1, 1]],
        8: [[1, 1, 1], [1, 0, 1], [1, 1, 1], [1, 0, 1], [1, 1, 1]]
    };

    const pattern = patterns[digit];
    if (!pattern) return;

    const scale = 2;

    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 3; col++) {
            if (pattern[row][col]) {
                const px = x + (col - 1) * scale;
                const py = y + (row - 2) * scale;
                render.fillRectangle(color, px, py, scale, scale);
            }
        }
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

        const numStr = pos.num.toString();

        if (numStr.length === 2) {
            // For two-digit numbers (12 and 10) - place digits side by side horizontally
            const spacing = 3;
            const firstDigit = parseInt(numStr[0]);
            const secondDigit = parseInt(numStr[1]);
            drawDigit(x - spacing, y, firstDigit, black);
            drawDigit(x + spacing, y, secondDigit, black);
        } else {
            drawDigit(x, y, pos.num, black);
        }
    }
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

    drawHand(cx, cy, hourAngle, radius * 0.6, blue, 5);
    drawHand(cx, cy, minuteAngle, radius * 0.92, blue, 5);

    render.drawCircle(blue, cx, cy, 6, 0, 360);

    render.end();
}

watch.addEventListener("minutechange", drawAnalogClock);
