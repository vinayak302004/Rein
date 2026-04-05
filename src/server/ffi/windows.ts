import koffi from "koffi"

const user32 = koffi.load("user32.dll")

const INPUT_MOUSE = 0

const MOUSEEVENTF_MOVE = 0x0001
const MOUSEEVENTF_LEFTDOWN = 0x0002
const MOUSEEVENTF_LEFTUP = 0x0004
const MOUSEEVENTF_WHEEL = 0x0800

const SendInput = user32.func(
	"UINT SendInput(UINT nInputs, void* pInputs, int cbSize)",
)

function createMouseInput(flags: number, dx = 0, dy = 0, data = 0) {
	const buffer = Buffer.alloc(40)

	buffer.writeUInt32LE(INPUT_MOUSE, 0) // type
	buffer.writeInt32LE(dx, 8) // dx
	buffer.writeInt32LE(dy, 12) // dy
	buffer.writeUInt32LE(data, 16) // mouseData (wheel)
	buffer.writeUInt32LE(flags, 20) // flags

	return buffer
}

export function moveMouse(dx: number, dy: number) {
	const input = createMouseInput(MOUSEEVENTF_MOVE, dx, dy)
	SendInput(1, input, 40)
}

export function mouseClick() {
	const down = createMouseInput(MOUSEEVENTF_LEFTDOWN)
	const up = createMouseInput(MOUSEEVENTF_LEFTUP)

	SendInput(1, down, 40)
	SendInput(1, up, 40)
}

export function scroll(delta: number) {
	const scaled = Math.max(-10, Math.min(10, delta)) * 120
	const input = createMouseInput(MOUSEEVENTF_WHEEL, 0, 0, scaled)

	SendInput(1, input, 40)
}
