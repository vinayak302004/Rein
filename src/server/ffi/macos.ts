import koffi from "koffi"

// Load CoreGraphics
const core = koffi.load(
	"/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics",
)

// Types
const CGEventCreateMouseEvent = core.func(
	"void* CGEventCreateMouseEvent(void*, int, {double x; double y;}, int)",
)

const CGEventCreateScrollWheelEvent = core.func(
	"void* CGEventCreateScrollWheelEvent(void*, int, int, int)",
)

const CGEventPost = core.func("void CGEventPost(int, void*)")
const CGEventGetLocation = core.func(
	" {double x; double y;} CGEventGetLocation(void*)",
)
const CGEventCreate = core.func("void* CGEventCreate(void*)")

// Constants
const kCGHIDEventTap = 0
const kCGEventMouseMoved = 5
const kCGEventLeftMouseDown = 1
const kCGEventLeftMouseUp = 2

let currentX = 0
let currentY = 0

function updateCurrentPosition() {
	const event = CGEventCreate(null)
	const point = CGEventGetLocation(event)
	currentX = point.x
	currentY = point.y
}

export function moveMouse(dx: number, dy: number) {
	updateCurrentPosition()

	currentX += dx
	currentY += dy

	const event = CGEventCreateMouseEvent(
		null,
		kCGEventMouseMoved,
		{ x: currentX, y: currentY },
		0,
	)

	CGEventPost(kCGHIDEventTap, event)
}

export function mouseClick() {
	updateCurrentPosition()

	const down = CGEventCreateMouseEvent(
		null,
		kCGEventLeftMouseDown,
		{ x: currentX, y: currentY },
		0,
	)

	const up = CGEventCreateMouseEvent(
		null,
		kCGEventLeftMouseUp,
		{ x: currentX, y: currentY },
		0,
	)

	CGEventPost(kCGHIDEventTap, down)
	CGEventPost(kCGHIDEventTap, up)
}

export function scroll(delta: number) {
	const scrollEvent = CGEventCreateScrollWheelEvent(
		null,
		0, // vertical
		1,
		-delta, // invert for natural scroll
	)

	CGEventPost(kCGHIDEventTap, scrollEvent)
}
