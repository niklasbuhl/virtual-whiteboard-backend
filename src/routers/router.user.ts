import express, { Request, Response, NextFunction } from "express"
import User, { IUser } from "../models/model.user"
import jwt from "jsonwebtoken"
// import crypto from "crypto"
import { compareAuth, createNewAuth } from "../functions/hashing"
import auth from "../middleware/auth"
import jwtDecode from "jwt-decode"
import IJwtPayloadContent from "../interfaces/interface.updatedJwtPayload"
import IAuth from "../interfaces/interface.auth"
import Role from "../enums/enum.role"
import errorResponse from "../middleware/errorResponse"
// import { Hash } from "crypto"

const router = express.Router()

// POST: Register User
router.post("/", async (req: Request, res: Response) => {
	console.log("New request.")

	try {
		// Collect information
		const { username, email, password, passwordVerify } = req.body
		// console.log(req.body)

		// Information Validation

		// Any missing information?
		if (!username || !email || !password || !passwordVerify)
			throw {
				errorMessage: "Please enter all required information.",
			}

		console.log("All information is received.")
		console.log(email)
		console.log(username)

		if (password.length < 6)
			throw { status: 406, errorMessage: "Password is too short." }

		// Password verify
		if (password != passwordVerify)
			throw { status: 406, errorMessage: "Please verify password." }

		console.log("Password okay.")

		// Email already used
		const existingUserWithEmail = await User.findOne({ email: email })

		if (existingUserWithEmail)
			throw {
				status: 409,
				errorMessage: "An user with that email already exists.",
			}

		console.log("Email okay.")

		// Username already used
		const existingUserWithUsername = await User.findOne({ username: username })

		if (existingUserWithUsername)
			throw {
				status: 409,
				errorMessage: "An user with that username already exists.",
			}

		console.log("Username okay.")

		// TODO Email verify by sending an email
		console.log("All information is unique.")

		// --- Create new user

		// Password Hashing
		const auth = createNewAuth(password)

		// Create new User
		const newUser: IUser = new User({
			username: username,
			email: email,
			auth: auth,
			role: Role.User,
		})

		console.log("Creating new user.")
		console.log(newUser)

		// Save the new User
		const savedUser = await newUser.save()

		// Log User in (create signed jwt cookie)
		const payload: IJwtPayloadContent = {
			user: savedUser._id,
		}

		const token = jwt.sign(payload, process.env.JWT_SECRET as string)

		// Respond with signed cookie
		res
			.cookie("token", token, {
				httpOnly: true,
				secure: true,
				sameSite: "none",
			})
			.json({ message: "User successfully registered." })

		// Done
	} catch (err: any) {
		console.error(err)

		errorResponse(res, err)
		// if (!err.status) err.status = 500
		// res.status(err.status).json(err.errorMessage)
	}
})

// PUT: Change user data
router.put("/", auth, async (req: Request, res: Response) => {
	try {
		// console.log("Update user data.")
		// console.log(req.body)
		// console.log(req.cookies.token)

		const { newUsername, newEmail, email, newPassword, password, otherUserId } =
			req.body

		console.log(`newUsername: ${newUsername}`)
		console.log(`newEmail: ${newEmail}`)
		console.log(`newPassword: ${newPassword}`)
		console.log(`email: ${email}`)

		const token = req.cookies.token

		const userId: string = jwtDecode<IJwtPayloadContent>(token).user

		// Find the current user document
		console.log(`UserId: ${userId}`)
		// Update username

		const user = await User.findById(userId)
		if (!user) throw "User not found."
		console.log(user)

		// Update information on current user
		if (!otherUserId) {
			const response = await saveNewUserInformation(
				user,
				password,
				newUsername,
				newEmail,
				email,
				newPassword
			)

			if (!response.success) throw response.message

			// res.status(response.status).json({ message: response.message })

			// return
		}

		// Admin changes on other user
		else if (otherUserId) {
			// Trying to change something on another user

			if (user.role != Role.Admin) throw "Not authorized."

			const otherUser = await User.findById(otherUserId)

			if (!otherUser) throw "Other user not found."

			// Try update information
			const response = await saveNewUserInformation(
				otherUser,
				password,
				newUsername,
				newEmail,
				email,
				newPassword
			)

			// Failed
			if (!response.success) throw response.message

			// Success
			// res.status(response.status).json({ message: response.message })

			// return
		}

		res.status(200).json({ message: "Information updated." })

		return
	} catch (err) {
		console.error(err)
		res.status(500).json({ errorMessage: err })
	}
})

// user, newUsername, newEmail, email, password, newPassword

// Return and array of success, message and code
async function saveNewUserInformation(
	user: IUser,
	password: string,
	newUsername?: string,
	newEmail?: string,
	previousEmail?: string,
	newPassword?: string
): Promise<{ success: boolean; message: string; status: number }> {
	try {
		console.log("Updating personal information.")

		if (newUsername) console.log(`newUsername: ${newUsername}`)
		if (newEmail) console.log(`newEmail: ${newEmail}`)
		if (newPassword) console.log(`newPassword`)

		if (!newUsername && !newEmail && !newPassword) throw "Missing information."

		// Email
		if (newEmail) {
			// Check if the current user knows the current email
			if (user.email != previousEmail) throw "Please enter current email."

			// Check if it is already the username
			if (user.email === newEmail) throw "This is already the email."

			if (await User.findOne({ email: newEmail }))
				// Check if this email is used by any other user
				throw "Email already in use."

			// Update email
			user.email = newEmail
		}

		// Username
		if (newUsername) {
			// Check if it is already the username
			console.log(user.username)

			if (user.username === newUsername) throw "This is already the username."

			// Check if this username is used by another user
			if (await User.findOne({ username: newUsername }))
				throw "Username already in use."

			// Update username
			user.username = newUsername
		}

		// Password
		if (newPassword && password) {
			if (!compareAuth(password, user.auth)) throw "Wrong password."

			const newAuth: IAuth = createNewAuth(newPassword)

			// Update authentication information
			user.auth = newAuth
		}

		// Save new information
		await user.save()

		return {
			success: true,
			message: "Information successfully saved.",
			status: 200,
		}
	} catch (err: any) {
		return {
			success: false,
			message: err,
			status: 500,
		}
	}
}

// GET: Get user data
router.get("/", auth, async (req: Request, res: Response) => {
	try {
		const { otherId, username, email } = req.body

		const token = req.cookies.token

		// Get current logged in user Id
		const userId: string = jwtDecode<IJwtPayloadContent>(token).user

		let query: {}

		// Select query
		if (otherId) query = { _id: otherId }
		else if (username) query = { username: username }
		else if (email) query = { email: email }
		else query = { _id: userId }

		// console.log(query)

		// Get user from MongoDB
		const user = await User.findOne(query)

		// Check if user is found
		if (!user) throw "User not found."

		// console.log(user)

		res.status(200).json({
			_id: user._id,
			username: user.username,
			email: user.email,
			role: user.role,
		})
	} catch (err) {
		console.error(err)
		res.status(500).json({ errorMessage: err })
	}
})

// DELETE: Delete a user
router.delete("/", auth, async (req: Request, res: Response) => {
	console.log("Delete User Request")

	try {
		const { otherId, username, email, password } = req.body

		const token = req.cookies.token

		const userId: string = jwtDecode<IJwtPayloadContent>(token).user

		const user = await User.findById(userId)

		// Check if the current user exists
		if (!user)
			throw {
				status: 400,
				errorMessage: "Couldn't find your user.",

				forceLogOut: true,
			}

		// Must enter correct password
		if (!compareAuth(password, user.auth))
			throw { status: 403, errorMessage: "Please enter correct password." }

		// Check if trying to delete another user
		if (
			otherId ||
			(username && username !== user.username) ||
			(email && email !== user.email)
		) {
			if (user.role !== Role.Admin)
				throw {
					status: 403,
					errorMessage: "Not authorized",
				}
		}

		// Select query
		let query: {}

		if (otherId) query = { _id: otherId }
		else if (username) query = { username: username }
		else if (email) query = { email: email }
		else query = { _id: userId }

		console.log(query)

		// Clear cookie if current cookie belonged to the removed user.
		const removeUser = await User.findOne(query, (err: any) => {
			if (err) throw err
		})

		if (!removeUser)
			throw { status: 409, errorMessage: "Couldn't find user to remove." }

		if (user._id === removeUser._id) {
			// Clear cookie
			res.cookie("token", "", {
				httpOnly: true,
				expires: new Date(0),
			})
		}

		// Remove user
		await User.findOneAndRemove(
			query,
			null,
			(err: any, document: IUser | null) => {
				if (err) throw err
			}
		)

		res.status(200).json({ message: "Deletion successful." })
	} catch (err) {
		console.error(err)
		errorResponse(res, err)
		// res.status(500).json({ errorMessage: err })
	}
})

module.exports = router
