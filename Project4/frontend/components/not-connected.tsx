import { Alert } from "./ui/alert"

const NotConnected = () => {
  return (
    <Alert className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
        <span>You are not connected, please connect your wallet to continue.</span>
    </Alert>
  )
}

export default NotConnected