import koffi from "koffi"

const core = koffi.load(
	"/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics",
)

const CGEventCreateMouseEvent = core.func(
	"void* CGEventCreateMouseEvent(void*, int, void*, int)",
)
const CGEventPost = core.func("void CGEventPost(int, void*)")

export function moveMouse(dx: number, dy: number) {
	const event = CGEventCreateMouseEvent(null, 5, null, 0)
	CGEventPost(0, event)
}

export function mouseClick() {
	const down = CGEventCreateMouseEvent(null, 1, null, 0)
	const up = CGEventCreateMouseEvent(null, 2, null, 0)

	CGEventPost(0, down)
	CGEventPost(0, up)
}

export function scroll(delta: number) {}
