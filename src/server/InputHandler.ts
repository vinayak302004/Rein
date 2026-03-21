import { execSync } from "node:child_process"

export type InputMessage =
	| { type: "move"; dx: number; dy: number }
	| { type: "click"; button: "left" | "right"; press: boolean }
	| { type: "scroll"; dx: number; dy: number }
	| { type: "key"; key: string }
	| { type: "text"; text: string }
	| { type: "combo"; keys: string[] }
	| { type: "copy" }
	| { type: "paste" }

export class InputHandler {
	private throttleMs: number
	private lastMove = 0

	constructor(throttleMs: number) {
		this.throttleMs = throttleMs
	}

	setThrottleMs(ms: number) {
		this.throttleMs = ms
	}

	async handleMessage(msg: InputMessage) {
		switch (msg.type) {
			case "move":
				this.handleMove(msg.dx, msg.dy)
				break

			case "click":
				this.handleClick(msg.button)
				break

			case "scroll":
				this.handleScroll(msg.dy)
				break

			case "key":
				this.handleKey(msg.key)
				break

			case "text":
				this.handleText(msg.text)
				break

			case "combo":
				this.handleCombo(msg.keys)
				break

			case "copy":
				this.handleCombo(["ctrl", "c"])
				break

			case "paste":
				this.handleCombo(["ctrl", "v"])
				break

			default:
				console.warn("Unknown message:", msg)
		}
	}

	// ----------------------

	private handleMove(dx: number, dy: number) {
		const now = Date.now()
		if (now - this.lastMove < this.throttleMs) return
		this.lastMove = now

		try {
			execSync(`xdotool mousemove_relative -- ${dx} ${dy}`)
		} catch (e) {
			console.error("Move failed:", e)
		}
	}

	private handleClick(button: "left" | "right") {
		const btn = button === "left" ? 1 : 3

		try {
			execSync(`xdotool click ${btn}`)
		} catch (e) {
			console.error("Click failed:", e)
		}
	}

	private handleScroll(delta: number) {
		try {
			if (delta > 0) execSync("xdotool click 5")
			else execSync("xdotool click 4")
		} catch (e) {
			console.error("Scroll failed:", e)
		}
	}

	private handleKey(key: string) {
		try {
			execSync(`xdotool key ${key}`)
		} catch (e) {
			console.error("Key failed:", e)
		}
	}

	private handleText(text: string) {
		try {
			execSync(`xdotool type --delay 0 "${text}"`)
		} catch (e) {
			console.error("Text failed:", e)
		}
	}

	private handleCombo(keys: string[]) {
		try {
			const combo = keys.join("+")
			execSync(`xdotool key ${combo}`)
		} catch (e) {
			console.error("Combo failed:", e)
		}
	}
}
