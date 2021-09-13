import { Response } from "express"

export default function errorResponse(res: Response, err: any): void {
	// If ForcedLogOut is not set, it must be false
	// if (!err.hasOwnProperty("forceLogOut")) err.forceLogOut = false
	// console.error(`Forced Log Out Check 1: ${err.forceLogOut}`)

	if (typeof err.forceLogOut === "undefined") err.forceLogOut = false

	console.error(`Forced Log Out: ${err.forceLogOut}`)

	if (err.forceLogOut) {
		// Set logout cookie
		res.cookie("token", "", {
			httpOnly: true,
			expires: new Date(0),
		})
	}

	// Internal server error message
	if (!(typeof err.serverMessage === "undefined"))
		console.error(`Server Error: ${err.serverMessage}`)

	// Error message
	if (!(typeof err.errorMessage === "undefined"))
		console.error(`Error Message: ${err.errorMessage}`)
	else err.errorMessage = "Unknown error."

	// Status
	if (!(typeof err.status === "undefined"))
		console.error(`Status: ${err.status}`)
	else err.status = 500

	// Return response
	res.status(err.status).json({
		errorMessage: err.errorMessage,
	})
}
