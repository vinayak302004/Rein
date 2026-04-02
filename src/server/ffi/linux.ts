import { execFile } from "node:child_process"

export function moveMouse(dx: number, dy: number) {
	execFile("xdotool", ["mousemove_relative", "--", String(dx), String(dy)])
}

export function mouseClick() {
	execFile("xdotool", ["click", "1"])
}

export function scroll(delta: number) {
	const btn = delta > 0 ? "5" : "4"
	execFile("xdotool", ["click", btn])
}
