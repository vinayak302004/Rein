import os from "node:os"

type FFIImpl = {
	moveMouse: (dx: number, dy: number) => void
	mouseClick: () => void
	scroll: (delta: number) => void
	keyTap: (key: string) => void
	typeText: (text: string) => void
	combo: (keys: string[]) => void
}

let impl: FFIImpl

try {
	switch (os.platform()) {
		case "win32":
			impl = require("./windows") as FFIImpl
			break

		case "linux":
			impl = require("./linux") as FFIImpl
			break

		case "darwin":
			impl = require("./macos") as FFIImpl
			break

		default:
			throw new Error("Unsupported OS")
	}
} catch (err) {
	console.warn("FFI not available, using fallback:", err)

	impl = {
		moveMouse: (dx, dy) => console.log("Fallback move:", dx, dy),
		mouseClick: () => console.log("Fallback click"),
		scroll: (delta) => console.log("Fallback scroll:", delta),
		keyTap: (key) => console.log("Fallback key:", key),
		typeText: (text) => console.log("Fallback text:", text),
		combo: (keys) => console.log("Fallback combo:", keys),
	}
}

// ✅ unified exports
export const moveMouse = impl.moveMouse
export const mouseClick = impl.mouseClick
export const scroll = impl.scroll
export const keyTap = impl.keyTap
export const typeText = impl.typeText
export const combo = impl.combo