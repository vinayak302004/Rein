import os from "node:os"

type FFIImpl = {
	moveMouse: (dx: number, dy: number) => void
	mouseClick: () => void
	scroll: (delta: number) => void
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
		moveMouse: (dx: number, dy: number) => {
			console.log("Fallback move:", dx, dy)
		},
		mouseClick: () => {
			console.log("Fallback click")
		},
		scroll: (delta: number) => {
			console.log("Fallback scroll:", delta)
		},
	}
}

export const moveMouse = impl.moveMouse
export const mouseClick = impl.mouseClick
export const scroll = impl.scroll
