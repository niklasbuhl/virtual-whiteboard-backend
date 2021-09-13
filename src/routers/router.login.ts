import express, { Response, Request, NextFunction, json } from "express"
import User from "../models/model.user"
import { compareAuth } from "../functions/hashing"
import jwt from "jsonwebtoken"
import IJwtPayloadContent from "../interfaces/interface.updatedJwtPayload"

const router = express.Router()

// POST: Login (Should be get? To get a cookie)

router.post("/login", async (req: Request, res: Response) => {
	console.log("Incoming Request!")

	try {
		// Collect information
		const { email, password } = req.body

		// Check information
		if (!email || !password) {
			return res
				.status(400)
				.json({ errorMessage: "Please enter all information " })
		}

		console.log("All information is received.")

		const existingUser = await User.findOne({ email })

		if (!existingUser) {
			console.log("There is a user with that email.")
			return res.status(401).json({ errorMessage: "Wrong email or password." })
		}

		const passwordCorrect: boolean = compareAuth(password, existingUser.auth)

		if (!passwordCorrect)
			return res.status(401).json({ errorMessage: "Wrong email or password." })

		console.log("The email and password are authorized!")

		// Create the token payload
		const payload: IJwtPayloadContent = {
			user: existingUser._id,
		}

		// Sign the token
		const token = jwt.sign(payload, process.env.JWT_SECRET as string)

		// Send the token
		res
			.cookie("token", token, {
				httpOnly: true,
				secure: true,
				sameSite: "none",
			})
			.json({ message: "Authorized!" })

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
router.get("/loggedIn", (req: Request, res: Response) => {
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

module.exports = router
