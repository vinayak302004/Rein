let pc: RTCPeerConnection | null = null
let dataChannel: RTCDataChannel | null = null
let remoteStream: MediaStream | null = null
let wsSend: ((msg: unknown) => void) | null = null

// 🔌 Register WebSocket sender (for signaling)
export function registerSignalSender(sender: (msg: unknown) => void) {
	wsSend = sender
}

// 🧠 Get or create PeerConnection
export function getPeer() {
	if (pc) return pc

	pc = new RTCPeerConnection({
		iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
	})

	remoteStream = new MediaStream()

	// 🎥 Receive remote video tracks
	pc.ontrack = (event) => {
		const stream = event.streams?.[0]
		if (!stream) return

		for (const track of stream.getTracks()) {
			remoteStream?.addTrack(track)
		}
	}

	// 🧊 Send ICE candidates via WebSocket signaling
	pc.onicecandidate = (event) => {
		if (!event.candidate || !wsSend) return

		wsSend({
			type: "webrtc-ice",
			candidate: event.candidate,
		})
	}

	// 📥 Provider side — receive input channel
	pc.ondatachannel = async (event) => {
		const channel = event.channel
		console.log("Input DataChannel received")

		channel.onopen = () => {
			console.log("Input DataChannel opened")
		}

		channel.onclose = () => {
			console.log("Input DataChannel closed")
		}

		// 🎮 Receive remote control messages
		channel.onmessage = async (event) => {
			try {
				const msg = JSON.parse(event.data)

				// ⚠️ IMPORTANT:
				// This file runs in browser.
				// Real input execution must run on Node server.
				// So we forward message through WebSocket fallback for now.

				if (wsSend) {
					wsSend({
						type: "remote-input",
						payload: msg,
					})
				}
			} catch (err) {
				console.error("DataChannel message error:", err)
			}
		}
	}

	return pc
}

// 📺 Remote media stream getter
export function getRemoteStream() {
	return remoteStream
}

// 🖱 Viewer side — create DataChannel to send inputs
export function createDataChannel() {
	const peer = getPeer()
	if (!peer) return

	dataChannel = peer.createDataChannel("input")

	dataChannel.onopen = () => {
		console.log("Input DataChannel ready")
	}

	dataChannel.onclose = () => {
		console.log("Input DataChannel closed")
	}
}

// 📤 Get channel for sending inputs
export function getDataChannel() {
	return dataChannel
}

// 📤 Send input via DataChannel (viewer → provider)
export function sendInput(msg: unknown) {
	if (!dataChannel) {
		console.warn("DataChannel not created yet")
		return
	}

	if (dataChannel.readyState !== "open") {
		console.warn("DataChannel not open:", dataChannel.readyState)
		return
	}

	dataChannel.send(JSON.stringify(msg))
}

// Expose for dev testing (remove in production)
if (typeof window !== "undefined") {
	// @ts-ignore
	window.getDataChannel = getDataChannel
}

// DEV ONLY — expose helpers to browser console
type ReinDebugAPI = {
	getDataChannel: typeof getDataChannel
	getPeer: typeof getPeer
}

declare global {
	interface Window {
		__rein?: ReinDebugAPI
	}
}

if (typeof window !== "undefined") {
	window.__rein = {
		getDataChannel,
		getPeer,
	}
}
