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

export function moveMouse(dx: number, dy: number) {
	const input = Buffer.alloc(40)

	input.writeUInt32LE(INPUT_MOUSE, 0)
	input.writeInt32LE(dx, 8)
	input.writeInt32LE(dy, 12)
	input.writeUInt32LE(MOUSEEVENTF_MOVE, 16)

	SendInput(1, input, 40)
}

export function mouseClick() {
	const inputDown = Buffer.alloc(40)
	const inputUp = Buffer.alloc(40)

	inputDown.writeUInt32LE(INPUT_MOUSE, 0)
	inputDown.writeUInt32LE(MOUSEEVENTF_LEFTDOWN, 16)

	inputUp.writeUInt32LE(INPUT_MOUSE, 0)
	inputUp.writeUInt32LE(MOUSEEVENTF_LEFTUP, 16)

	SendInput(1, inputDown, 40)
	SendInput(1, inputUp, 40)
}

export function scroll(delta: number) {
	const input = Buffer.alloc(40)

	input.writeUInt32LE(INPUT_MOUSE, 0)
	input.writeUInt32LE(MOUSEEVENTF_WHEEL, 16)
	input.writeInt32LE(delta * 120, 20)

	SendInput(1, input, 40)
}
