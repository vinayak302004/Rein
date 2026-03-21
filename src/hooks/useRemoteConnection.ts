"use client"

import { useEffect } from "react"
import { useConnection } from "../contexts/ConnectionProvider"
import { createDataChannel, getPeer, sendInput } from "@/webrtc/webrtcManager"

export const useRemoteConnection = () => {
	const { wsRef, status, platform, subscribe } = useConnection()

	// ✅ Create WebRTC DataChannel on viewer side
	useEffect(() => {
		if (status !== "connected") return

		const pc = getPeer()
		if (!pc) return

		// Create input channel BEFORE offer
		createDataChannel()
	}, [status])

	// 🖱 All input goes via WebRTC
	const send = (msg: unknown) => {
		sendInput(msg)
	}

	// 🎹 Keyboard combo helper
	const sendCombo = (keys: string[]) => {
		sendInput({
			type: "combo",
			keys,
		})
	}

	return { status, platform, send, sendCombo, wsRef, subscribe }
}
