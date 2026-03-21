let pc: RTCPeerConnection | null = null
let dataChannel: RTCDataChannel | null = null
let remoteStream: MediaStream | null = null
let wsSend: ((msg: unknown) => void) | null = null

export function registerSignalSender(sender: (msg: unknown) => void) {
	wsSend = sender
}

export function getPeer() {
	if (!pc) {
		pc = new RTCPeerConnection({
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
		})

		remoteStream = new MediaStream()

		// 🎥 Receive remote tracks
		pc.ontrack = (event) => {
			const tracks = event.streams[0].getTracks()
			for (const track of tracks) {
				remoteStream?.addTrack(track)
			}
		}

		// 🧊 Send ICE candidates via WebSocket
		pc.onicecandidate = (event) => {
			if (event.candidate && wsSend) {
				wsSend({
					type: "webrtc-ice",
					candidate: event.candidate,
				})
			}
		}

		// 📥 Receive DataChannel (provider side)
		pc.ondatachannel = (event) => {
			const channel = event.channel

			channel.onopen = () => {
				console.log("DataChannel opened")
			}

			channel.onclose = () => {
				console.log("DataChannel closed")
			}

			// 🎮 Receive input events
			channel.onmessage = async (event) => {
				try {
					const msg = JSON.parse(event.data)

					// Lazy import to avoid bundling server code on client
					const { InputHandler } = await import("../server/InputHandler")
					const inputHandler = new InputHandler()

					await inputHandler.handleMessage(msg)
				} catch (err) {
					console.error("DataChannel input error:", err)
				}
			}
		}
	}

	return pc
}

export function getRemoteStream() {
	return remoteStream
}

// 🖱 Viewer side — create channel to send inputs
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

export function getDataChannel() {
	return dataChannel
}
