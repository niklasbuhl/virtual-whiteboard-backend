import express, { Response, Request, NextFunction, json } from "express"
import User from "../models/model.user"
import { compareAuth } from "../functions/hashing"
import jwt from "jsonwebtoken"
import IJwtPayloadContent from "../interfaces/interface.updatedJwtPayload"
import IFrontendUser from "../interfaces/interface.frontendUser"
import getIdFromToken from "../functions/getIdFromToken"
import auth from "../middleware/auth"

const router = express.Router()

// POST: Login (Should be get? To get a cookie)

router.post("/login", async (req: Request, res: Response) => {
	console.log("Incoming Request!")

	try {
		// Collect information
		const { user, password } = req.body

		// Check information
		if (!user || !password) {
			return res
				.status(400)
				.json({ errorMessage: "Please enter all information " })
		}

		console.log("All information is received.")
		console.log(`${user}`)

		// Try as username
		var existingUser = await User.findOne({ username: user })

		// Try as email
		if (!existingUser) existingUser = await User.findOne({ email: user })

		// Still no user
		if (!existingUser) {
			return res
				.status(401)
				.json({ errorMessage: "Wrong username, email or password." })
		}

		const passwordCorrect: boolean = compareAuth(password, existingUser.auth)

		if (!passwordCorrect)
			return res
				.status(401)
				.json({ errorMessage: "Wrong username, email or password." })

		console.log("The email and password are authorized!")

		// Create the token payload
		const payload: IJwtPayloadContent = {
			user: existingUser._id,
		}

		// Sign the token
		const token = jwt.sign(payload, process.env.JWT_SECRET as string)

		// Send the FrontendUser information
		const frontendUser: IFrontendUser = {
			username: existingUser.username,
			role: existingUser.role,
			_id: existingUser._id,
		}

		// Send the token
		res
			.cookie("token", token, {
				httpOnly: true,
				secure: true,
				sameSite: "none",
			})
			.json({ message: "Authorized!", user: frontendUser })

		// Done
	} catch (err) {
		console.error(err)
		res.sendStatus(500)
	}
})

// GET: Logout
router.get("/logout", (req: Request, res: Response) => {
	// Send a cookie that is already expired in place of the JWT
	res
		.cookie("token", "", {
			httpOnly: true,
			expires: new Date(0),
		})
		.json({ message: "Logged out." })
})

// GET: Logged In
router.get("/loggedIn", async (req: Request, res: Response) => {
	try {
		// Get the cookie
		const token = req.cookies.token

		// Check for any cookie
		if (!token) throw "No token-cookie found."

		// JWT throws an error if it doesn't match
		jwt.verify(token, process.env.JWT_SECRET as string)

		// All is good, user is logged in
		res.json(true)

		// Done
	} catch (err) {
		console.log(err)
		res.json(false)
	}
})

router.get("/loggedInUser", auth, async (req: Request, res: Response) => {
	try {
		// Return user info
		const userId = getIdFromToken(req.cookies.token)

		console.log(`User ID: ${userId}`)

		const existingUser = await User.findOne({ _id: userId })

		if (!existingUser)
			throw {
				errorMessage: "No user found.",
			}

		const frontendUser: IFrontendUser = {
			username: existingUser.username,
			role: existingUser.role,
			_id: existingUser._id,
		}

		res.status(200).json(frontendUser)
	} catch (err: any) {
		res.status(404).json(err.errorMessage)
	}
})

module.exports = router
