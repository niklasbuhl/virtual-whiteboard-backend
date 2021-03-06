import express, { Response, Request, NextFunction, response } from "express"
import getIdFromToken from "../functions/getIdFromToken"
import auth from "../middleware/auth"
import User, { IUser } from "../models/model.user"
import Text, { IText } from "../models/model.text"
import errorResponse from "../middleware/errorResponse"
import { ObjectID } from "mongodb"
import Mongoose from "mongoose"
import Role from "../enums/enum.role"
import IFrontendUser from "../interfaces/interface.frontendUser"
import IFrontendText from "../interfaces/interface.frontendText"

const router = express.Router()

// POST: Create new text
router.post("/", auth, async (req: Request, res: Response) => {
	// content
	// authorId
	// authorName
	// createdAt

	try {
		// Saving new text
		// console.log("POST Request for text")
		// console.log(req.body)
		// Content
		const { content, text, x, y } = req.body
		if (!content && !text)
			throw {
				status: 204,
				errorMessage: "No content.",
			}

		if (content && text) {
			throw {
				status: 500,
				errorMessage: "Please only use either 'content' or 'text'.",
			}
		}

		if (!x && !y) {
			throw {
				status: 204,
				errorMessage: "No coords.",
			}
		}

		// AuthorId
		const authorId = getIdFromToken(req.cookies.token)
		if (!authorId)
			throw {
				status: 500,
				errorMessage: "No user id.",
			}

		// AuthorName
		const author = await User.findOne({ _id: authorId })

		if (!author)
			throw {
				status: 500,
				errorMessage: "No user.",
				forceLogOut: true,
			}

		// const authorName = currentUser.username

		// CreatedAt
		const createdAt = new Date()

		// Create new text
		const newText: IText = new Text({
			text: content || text,
			author: author._id,
			editInfo: {
				createdAt: createdAt,
			},
			pos: {
				x: x,
				y: y,
			},
		})

		console.log(newText)

		await newText.save()

		res
			.status(201)
			.json({ message: "Text created successfully.", id: newText._id })

		// Done
	} catch (err: any) {
		console.error(err.forceLogOut)
		console.error(err.serverMessage)
		console.error(err.errorMessage)

		if (err.forceLogOut)
			res.cookie("token", "", {
				httpOnly: true,
				expires: new Date(0),
			})

		res.status(err.status).json(err.errorMessage)
	}
})

// PUT: Update text
router.put("/", auth, async (req: Request, res: Response) => {
	console.log("PUT Request")
	try {
		console.log(req.body)

		const { content, text, textId, contentId, id, x, y } = req.body

		var updateTextId: string,
			newText: string = "",
			newX: number = 0,
			newY: number = 0,
			updateText: boolean = false,
			updatePosition: boolean = false

		// Check for content id
		if (!textId && !contentId && !id)
			throw {
				errorMessage: "No text id.",
				status: 406,
			}
		else updateTextId = (textId || contentId || id).toString()

		console.log(`Found content id: ${updateTextId}`)

		// Check for any content or position
		if (!content && !text && !x && !y) {
			throw {
				errorMessage: "No text content or position.",
				status: 406,
			}
		} else {
			console.log("Found new content.")
			// If there is content or text
			if (content || text) {
				newText = (content || text).toString()
				updateText = true
			}

			// If there is a new position
			if (x && y) {
				newX = x
				newY = y
				updatePosition = true
			}
		}

		// Get user id
		const userId = getIdFromToken(req.cookies.token)

		if (!userId)
			throw {
				errorMessage: "User not found.",
				status: 401,
				forceLogOut: true,
				serverError: "Someone authorized tried to update a text.",
			}

		console.log("Found user ID in cookie.")

		// Check for valid id
		if (!ObjectID.isValid(updateTextId))
			throw {
				errorMessage: `Invalid object id.`,
				status: 406,
			}

		console.log("Text ID is valid.")

		// Find a text
		console.log(`Finding a text with id: ${updateTextId}`)

		const textToUpdate: IText | Mongoose.Error.CastError | null =
			await Text.findById(updateTextId, function (err: any, text: Text): void {
				if (err) {
					console.log(`Mongoose Error: ${err.message}`)

					err.serverMessage = err.message
					err.status = 406

					errorResponse(res, err)
				} else {
					console.log("Success...")
				}
			})

		console.log("Found a text:")

		console.log(textToUpdate)

		// Make sure a text is found.
		if (!textToUpdate)
			throw {
				errorMessage: `No text item found with id: ${updateTextId}.`,
				status: 404,
			}

		// Check if the current user is the author of the text.
		console.log(`User id: ${userId}, text author id: ${textToUpdate.author}`)

		if ((userId as string) != (textToUpdate.author as string)) {
			// Not the author

			// Find out if current user is moderator or admin
			const superUser = await User.findOne({ _id: userId })

			if (superUser) {
				const userRole = superUser.role

				if (userRole != Role.Moderator && userRole != Role.Admin) {
					throw {
						errorMessage:
							"Text item found, but it didn't below to you. And you don't have authority",
						status: 403,
					}
				}
			} else {
				throw {
					errorMessage: "No super user found.",
					status: 403,
				}
			}
		}

		// Check if the text is different
		if (updateText && textToUpdate.text === newText) {
			updateText = false
			console.log("Similar text.")
		}

		if (
			updatePosition &&
			textToUpdate.pos.x === newX &&
			textToUpdate.pos.y === newY
		) {
			updatePosition = false
			console.log("Similar position.")
		}

		if (!updateText && !updatePosition) {
			throw {
				errorMessage:
					"New position and text is identical to current information.",
				status: 406,
			}
		}

		// Everything should be ok now.
		console.log("Everything should a-okay.")

		// Save new text
		if (updateText) textToUpdate.text = newText

		// Save new position
		if (updatePosition) {
			textToUpdate.pos.x = newX
			textToUpdate.pos.y = newY
		}

		// Set edited to true
		textToUpdate.editInfo.edited = true

		// Set the time of the update
		// textToUpdate.set({ editInfo.lastEditAt: new Date() })

		textToUpdate.editInfo.lastEditAt = new Date()
		textToUpdate.editInfo.lastEditBy = userId as string

		// Save the text
		await textToUpdate.save((err, text) => {
			if (err)
				throw {
					serverMessage: err,
					errorMessage: "Error while saving.",
					status: 500,
				}

			console.log(text)
			res.status(202).json(true)
		})

		// Done
	} catch (err) {
		errorResponse(res, err)
	}
})

// GET: Get text
router.get("/", async (req: Request, res: Response) => {
	try {
		const { textId, contentId, id } = req.body

		var getTextId: string

		if (!textId && !contentId && !id)
			throw {
				errorMessage: "Please provide an id.",
				status: 406,
			}
		else getTextId = textId || contentId || id

		// Valid Id
		if (!ObjectID.isValid(getTextId))
			throw {
				errorMessage: `Invalid object id.`,
				status: 406,
			}

		// Get Text
		const text = await Text.findById(getTextId, (err: any) => {
			if (err)
				throw {
					errorMessage: "Error while finding the text.",
					serverMessage: err.message,
					status: 500,
				}
		})

		if (!text)
			throw {
				errorMessage: "No text found with that id.",
				status: 404,
			}

		const author = await User.findOne({ _id: text.author })

		if (!author)
			throw {
				errorMessage: "No author information",
			}

		const frontendUser: IFrontendUser = {
			username: author.username,
			role: author.role,
			_id: author._id,
		}

		// console.log("Frontend User")
		// console.log(frontendUser)

		// Create a new frontendText
		var resText: IFrontendText = {
			_id: text._id,
			text: text.text,
			pos: text.pos,
			author: frontendUser,
			editInfo: text.editInfo,
		}

		// console.log("Response Text")
		// console.log(resText)

		res.status(200).json(resText)

		// Done
	} catch (err) {
		errorResponse(res, err)
	}
})

// DELETE: Delete text
router.delete("/", auth, async (req: Request, res: Response) => {
	try {
		const { contentId, textId, id } = req.body

		// Check for any id
		if (!contentId && !textId && !id)
			throw {
				errorMessage: "Please provide id.",
				status: 406,
			}

		// Valid Id
		const validId = contentId || textId || id

		if (!ObjectID.isValid(validId))
			throw {
				errorMessage: "Invalid id.",
				status: 406,
			}

		// Find a text
		const text = await Text.findById(validId)

		if (!text)
			throw {
				errorMessage: "No text found with that id.",
				status: 404,
			}

		// Check if the authorId matches the Id
		const userId = getIdFromToken(req.cookies.token)

		/*
		
		if (userId != text.author._id)
		throw {
			errorMessage: "You did not create this text.",
				status: 403,
			}

		*/

		if ((userId as string) != (text.author as string)) {
			// Not the author

			// Find out if current user is moderator or admin
			const superUser = await User.findOne({ _id: userId })

			if (superUser) {
				const userRole = superUser.role

				if (userRole != Role.Moderator && userRole != Role.Admin) {
					throw {
						errorMessage:
							"Text item found, but it didn't below to you. And you don't have authority",
						status: 403,
					}
				}
			} else {
				throw {
					errorMessage: "No super user found.",
					status: 403,
				}
			}
		}

		// A-okay
		await Text.findByIdAndRemove(
			validId,
			null,
			(err: any, text: IText | null) => {
				if (err)
					throw {
						errorMessage: "Something went wrong during deletion.",
						serverMessage: err.message,
						status: 500,
					}
			}
		)

		res.status(202).json({ message: "Text successfully deleted." })

		// Done
	} catch (err) {
		errorResponse(res, err)
	}
})

// Get all texts
router.get("/getAll/", async (req: Request, res: Response) => {
	console.log("Get all texts.")

	try {
		const texts = await Text.find()
		console.log(texts)

		if (!texts)
			throw {
				status: 413,
				errorMessage: "No texts found.",
			}

		var resTexts: IFrontendText[] = []

		// Change to FrontendText
		for (var text of texts) {
			const author = await User.findOne({ _id: text.author })

			if (!author) continue

			const user: IFrontendUser = {
				_id: author._id,
				username: author.username,
				role: author.role,
			}

			const newText: IFrontendText = {
				_id: text._id,
				text: text.text,
				pos: text.pos,
				author: user,
				editInfo: text.editInfo,
			}

			resTexts.push(newText)
		}

		res.status(200).json(resTexts)
	} catch (err: any) {}
})

module.exports = router
