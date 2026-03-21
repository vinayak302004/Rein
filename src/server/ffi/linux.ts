import fs from "node:fs"

const fd = fs.openSync("/dev/uinput", "w")

export function moveMouse(dx: number, dy: number) {
	// Simplified PoC (real impl uses input_event struct)
	const buf = Buffer.alloc(24)

	buf.writeInt32LE(dx, 8)
	buf.writeInt32LE(dy, 12)

	fs.writeSync(fd, buf)
}

export function mouseClick() {
	// stub for PoC
}

export function scroll(delta: number) {
	// stub for PoC
}
