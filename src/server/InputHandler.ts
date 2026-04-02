import { moveMouse, mouseClick, scroll } from "./ffi/index"

export type InputMessage =
	| { type: "move"; dx: number; dy: number }
	| { type: "click"; button: "left" | "right" }
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
		}
	}

	// ✅ STABLE + SMOOTH
	private async handleMove(dx: number, dy: number) {
		const now = Date.now()

		if (now - this.lastMove < this.throttleMs) return

		// ignore tiny noise
		if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return

		this.lastMove = now

		moveMouse(dx, dy)
	}

	private handleClick(button: "left" | "right") {
		mouseClick()
	}

	private handleScroll(delta: number) {
		scroll(delta)
	}
}
