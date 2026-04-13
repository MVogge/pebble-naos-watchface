import Poco from "commodetto/Poco";

const render = new Poco(screen);
const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);
const blue = render.makeColor(0, 0, 255);

function getHandAngles(now) {
	const hours = now.getHours() % 12;
	const minutes = now.getMinutes();
	const seconds = now.getSeconds();

	// Angles in degrees (0 = 12 o'clock)
	const minuteAngle = minutes * 6 + seconds * 0.1;
	const hourAngle = hours * 30 + minutes * 0.5; // 360/12 = 30 degrees per hour

	return { hourAngle, minuteAngle};
}

function drawHand(cx, cy, angle, length, color, thickness) {
	// Convert angle to radians (0 degrees = up)
	const radians = (angle - 90) * Math.PI / 180;

	const endX = cx + Math.cos(radians) * length;
	const endY = cy + Math.sin(radians) * length;

	render.drawLine(cx, cy, endX, endY, color, thickness);
}

function drawAnalogClock(e) {
	const cx = render.width / 2;
	const cy = render.height / 2;
	const { hourAngle, minuteAngle } = getHandAngles(e.date);

	render.begin();
	render.fillRectangle(white, 0, 0, render.width, render.height);

	// Hour hand
	drawHand(cx, cy, hourAngle, (render.width / 2 - 50), blue, 5);

	// Minute hand
	drawHand(cx, cy, minuteAngle, (render.width / 2 - 20), blue, 5);

	// Center dot
	render.drawCircle(blue, cx, cy, 7, 0, 360);

	render.end();
}

watch.addEventListener("minutechange", drawAnalogClock);