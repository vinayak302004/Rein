import { execFile } from "node:child_process"

// small helper (avoid repeating)
function run(args: string[]) {
	execFile("xdotool", args, (err) => {
		if (err) {
			console.error("xdotool error:", err.message)
		}
	})
}

// ✅ Mouse move (relative)
export function moveMouse(dx: number, dy: number) {
	run(["mousemove_relative", "--", String(dx), String(dy)])
}

// ✅ Mouse click (supports left/right/middle)
export function mouseClick(button: "left" | "right" | "middle" = "left") {
	const map = {
		left: "1",
		middle: "2",
		right: "3",
	}

	run(["click", map[button]])
}

// ✅ Scroll (vertical)
export function scroll(delta: number) {
	if (delta === 0) return

	const btn = delta > 0 ? "5" : "4" // 5 = down, 4 = up
	run(["click", btn])
}

// ✅ Single key press
export function keyTap(key: string) {
	if (!key) return

	const keyMap: Record<string, string> = {
		backspace: "BackSpace",
		enter: "Return",
		space: "space",
		tab: "Tab",
		escape: "Escape",
		esc: "Escape",
		delete: "Delete",
		arrowup: "Up",
		arrowdown: "Down",
		arrowleft: "Left",
		arrowright: "Right",
	}

	const mapped = keyMap[key.toLowerCase()] || key

	run(["key", "--clearmodifiers", mapped])
}

// ✅ Type full text (FAST + STABLE)
export function typeText(text: string) {
	if (!text) return

	run([
		"type",
		"--clearmodifiers",
		"--delay",
		"1", // fast typing
		text,
	])
}

// ✅ Key combo (ctrl+c, alt+tab, etc.)
export function combo(keys: string[]) {
	if (!keys || keys.length === 0) return

	const comboStr = keys.map((k) => k.toLowerCase()).join("+")
	run(["key", "--clearmodifiers", comboStr])
}
