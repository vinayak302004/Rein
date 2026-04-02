"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useCaptureProvider(wsRef: React.RefObject<WebSocket | null>) {
	const [isSharing, setIsSharing] = useState(false)

	const videoRef = useRef<HTMLVideoElement | null>(null)
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const timerRef = useRef<number | null>(null)

	// STOP SHARING CLEANLY
	const stopSharing = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current)
			timerRef.current = null
		}

		if (streamRef.current) {
			for (const track of streamRef.current.getTracks()) {
				track.stop()
			}
			streamRef.current = null
		}

		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify({ type: "stop-mirror" }))
		}

		setIsSharing(false)
	}, [wsRef])

	// OPTIMIZED FRAME CAPTURE
	const captureFrame = useCallback(() => {
		const ws = wsRef.current
		if (!videoRef.current || !canvasRef.current || !ws) return
		if (ws.readyState !== WebSocket.OPEN) return

		// BACKPRESSURE CONTROL
		if (ws.bufferedAmount > 512 * 1024) return

		const video = videoRef.current
		const canvas = canvasRef.current
		const ctx = canvas.getContext("2d", { alpha: false })
		if (!ctx) return

		let MAX_DIM = 960

		// 🔥 ADAPTIVE RESOLUTION
		if (ws.bufferedAmount > 700 * 1024) {
			MAX_DIM = 720
		}

		let width = video.videoWidth
		let height = video.videoHeight

		if (width === 0 || height === 0) return

		if (width > MAX_DIM || height > MAX_DIM) {
			const ratio = Math.min(MAX_DIM / width, MAX_DIM / height)
			width = Math.floor(width * ratio)
			height = Math.floor(height * ratio)
		}

		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width
			canvas.height = height
		}

		ctx.drawImage(video, 0, 0, width, height)

		const format = "image/jpeg"
		const quality = 0.45

		canvas.toBlob(
			(blob) => {
				if (!blob) return
				if (ws.readyState !== WebSocket.OPEN) return

				ws.send(blob)
			},
			format,
			quality,
		)
	}, [wsRef])

	// ADAPTIVE LOOP (REPLACES setInterval)
	const startLoop = useCallback(() => {
		const loop = () => {
			captureFrame()

			const ws = wsRef.current
			let delay = 40 // default ~25 FPS

			if (ws) {
				if (ws.bufferedAmount > 800 * 1024) delay = 120
				else if (ws.bufferedAmount > 400 * 1024) delay = 80
				else delay = 40
			}

			timerRef.current = window.setTimeout(loop, delay)
		}

		loop()
	}, [captureFrame, wsRef])

	// START SHARING
	const startSharing = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					displaySurface: "monitor",
					frameRate: { ideal: 30, max: 30 },
				},
			})

			// Create hidden video
			if (!videoRef.current) {
				videoRef.current = document.createElement("video")
				videoRef.current.muted = true
				videoRef.current.playsInline = true
			}

			// Create hidden canvas
			if (!canvasRef.current) {
				canvasRef.current = document.createElement("canvas")
			}

			const video = videoRef.current
			video.srcObject = stream

			await video.play()

			streamRef.current = stream
			setIsSharing(true)

			// Notify server
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				wsRef.current.send(JSON.stringify({ type: "start-provider" }))
			}

			// START ADAPTIVE LOOP
			startLoop()

			// Handle stop
			stream.getVideoTracks()[0].onended = () => {
				stopSharing()
			}
		} catch (err) {
			console.error("Failed to start screen capture:", err)
			setIsSharing(false)
		}
	}, [wsRef, startLoop, stopSharing])

	// CLEANUP
	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current)

			if (streamRef.current) {
				for (const track of streamRef.current.getTracks()) {
					track.stop()
				}
			}
		}
	}, [])

	return {
		isSharing,
		startSharing,
		stopSharing,
	}
}
