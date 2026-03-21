import { useConnection } from "../contexts/ConnectionProvider"

export function useRemoteConnection() {
	const { send } = useConnection()

	const sendMessage = (msg: unknown) => {
		console.log("Sending to backend:", msg)
		send(msg) // ✅ ACTUAL WEBSOCKET SEND
	}

	return {
		send,
		sendCombo: (keys: string[]) => {
			send({ type: "combo", keys })
		},
	}
}
