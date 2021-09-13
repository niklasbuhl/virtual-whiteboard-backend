import express, { Response, Request, NextFunction, response } from "express"
import getIdFromToken from "../functions/getIdFromToken"
import auth from "../middleware/auth"
import User from "../models/model.user"
import Text, { IText } from "../models/model.text"
import errorResponse from "../middleware/errorResponse"
import { ObjectID } from "mongodb"
import Mongoose from "mongoose"

const router = express.Router()

// POST: Create new text
router.post("/", auth, async (req: Request, res: Response) => {
	// content
	// authorId
	// authorName
	// createdAt

	try {
		// Content
		const { content, text } = req.body
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

		// AuthorId
		const authorId = getIdFromToken(req.cookies.token)
		if (!authorId)
			throw {
				status: 500,
				errorMessage: "No user id.",
			}

		// AuthorName
		const currentUser = await User.findOne({ _id: authorId })

		if (!currentUser)
			throw {
				status: 500,
				errorMessage: "No user.",
				forceLogOut: true,
			}

		const authorName = currentUser.username

		// CreatedAt
		const createdAt = new Date()

		// Create new text
		const newText: IText = new Text({
			content: content || text,
			authorId: authorId,
			authorName: authorName,
			createdAt: createdAt,
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
	try {
		// console.log("Updating text...")

		const { content, text, textId, contentId, id } = req.body

		var updateTextId: string, newContent: string

		// Check for any content
		if (!content && !text)
			throw {
				errorMessage: "No text content.",
				status: 406,
			}
		else newContent = (content || text).toString()

		// Check for content id
		if (!textId && !contentId && !id)
			throw {
				errorMessage: "No text id.",
				status: 406,
			}
		else updateTextId = (textId || contentId || id).toString()

		// Get user id
		const userId = getIdFromToken(req.cookies.token)

		if (!userId)
			throw {
				errorMessage: "User not found.",
				status: 401,
				forceLogOut: true,
				serverError: "Someone authorized tried to update a text.",
			}

		// Check for valid id
		if (!ObjectID.isValid(updateTextId))
			throw {
				errorMessage: `Invalid object id.`,
				status: 406,
			}

		// Find a text.
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

		console.log(textToUpdate)

		// Make sure a text is found.
		if (!textToUpdate)
			throw {
				errorMessage: `No text item found with id: ${updateTextId}.`,
				status: 404,
			}

		// Check if the current user is the author of the text.
		console.log(`User id: ${userId}, text author id: ${textToUpdate.authorId}`)

		if (userId !== textToUpdate.authorId)
			throw {
				errorMessage: "Text item found, but it didn't below to you.",
				status: 403,
			}

		// Check if the text is different
		if (textToUpdate.content === newContent)
			throw {
				errorMessage: "New text is identical to current text.",
				status: 406,
			}

		// Everything should be ok now.
		console.log("Everything should a-okay.")

		// Save new text
		textToUpdate.content = newContent

		// Set edited to true
		textToUpdate.edited = true

		// Set the time of the update
		textToUpdate.editedAt = new Date()

		// Save the text
		textToUpdate.save((err, text) => {
			if (err)
				throw {
					serverMessage: err,
					errorMessage: "Error while saving.",
					status: 500,
				}

			console.log(text)
			res.status(202).json({ message: "Text successfully saved." })
		})

		// Done
	} catch (err) {
		errorResponse(res, err)
	}
})

// GET: Get text
router.get("/", auth, async (req: Request, res: Response) => {
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

		res.status(200).json(text)

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

		if (userId != text.authorId)
			throw {
				errorMessage: "You did not create this text.",
				status: 403,
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

module.exports = router
