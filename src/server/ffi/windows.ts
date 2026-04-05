import koffi from "koffi"

const user32 = koffi.load("user32.dll")

// ===== CONSTANTS =====
const INPUT_MOUSE = 0
const INPUT_KEYBOARD = 1

const KEYEVENTF_KEYUP = 0x0002

const MOUSEEVENTF_MOVE = 0x0001
const MOUSEEVENTF_LEFTDOWN = 0x0002
const MOUSEEVENTF_LEFTUP = 0x0004
const MOUSEEVENTF_WHEEL = 0x0800

const SendInput = user32.func(
	"uint32 SendInput(uint32 nInputs, void* pInputs, int cbSize)",
)

// ===== KEY MAP =====
const KEY_MAP: Record<string, number> = {
	enter: 0x0d,
	backspace: 0x08,
	space: 0x20,
	shift: 0x10,
	control: 0x11,
	ctrl: 0x11,
	alt: 0x12,
	tab: 0x09,
	escape: 0x1b,
}

// ===== HELPERS =====
function getKeyCode(key: string): number {
	if (KEY_MAP[key]) return KEY_MAP[key]

	if (key.length === 1) {
		return key.toUpperCase().charCodeAt(0)
	}

	console.warn("Unknown key:", key)
	return 0
}

// ===== INPUT BUILDERS =====
function createMouseInput(flags: number, dx = 0, dy = 0, data = 0) {
	const buffer = Buffer.alloc(40)

	buffer.writeUInt32LE(INPUT_MOUSE, 0)
	buffer.writeInt32LE(dx, 8)
	buffer.writeInt32LE(dy, 12)
	buffer.writeUInt32LE(data, 16)
	buffer.writeUInt32LE(flags, 20)

	return buffer
}

function createKeyboardInput(vk: number, flags = 0) {
	const buffer = Buffer.alloc(40)

	buffer.writeUInt32LE(INPUT_KEYBOARD, 0)
	buffer.writeUInt16LE(vk, 8)
	buffer.writeUInt16LE(0, 10)
	buffer.writeUInt32LE(flags, 12)

	return buffer
}

// ===== MOUSE =====
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

// ===== KEYBOARD =====
export function keyTap(key: string) {
	const vk = getKeyCode(key)
	if (!vk) return

	const down = createKeyboardInput(vk, 0)
	const up = createKeyboardInput(vk, KEYEVENTF_KEYUP)

	SendInput(1, down, 40)
	SendInput(1, up, 40)
}

export function typeText(text: string) {
	for (const char of text) {
		keyTap(char)
	}
}

export function combo(keys: string[]) {
	const codes = keys.map(getKeyCode).filter(Boolean)

	for (const vk of codes) {
		SendInput(1, createKeyboardInput(vk, 0), 40)
	}

	for (const vk of codes.reverse()) {
		SendInput(1, createKeyboardInput(vk, KEYEVENTF_KEYUP), 40)
	}
}
