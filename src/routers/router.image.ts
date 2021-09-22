import express, { Request, Response } from "express"
import getIdFromToken from "../functions/getIdFromToken"
import auth from "../middleware/auth"
import ImageModel, { IImage } from "../models/model.image"
import User from "../models/model.user"
import Mongoose from "mongoose"
import { ObjectID } from "mongodb"
import errorResponse from "../middleware/errorResponse"
import Role from "../enums/enum.role"
import IFrontendUser from "../interfaces/interface.frontendUser"
import IFrontendImage from "../interfaces/interface.frontendImage"

const router = express.Router()

// POST: Create new image
router.post("/", auth, async (req: Request, res: Response) => {
	console.log("POST Image Request")

	// url
	// posX
	// posY
	// scaleX
	// scaleY

	try {
		const { url, posX, posY, scaleX, scaleY } = req.body

		if (!url)
			throw {
				status: 204,
				errorMessage: "No image URL.",
			}

		if (!posX && !posY)
			throw {
				status: 204,
				errorMessage: "No image position.",
			}

		if (!scaleX && !scaleY)
			throw {
				status: 204,
				errorMessage: "No image scale.",
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

		// CreatedAt
		const createdAt = new Date()

		// Create new Image
		const newImage: IImage = new ImageModel({
			url: url,
			author: author._id,
			editInfo: {
				createdAt: createdAt,
			},
			pos: {
				x: posX,
				y: posY,
			},
			scale: {
				x: scaleX,
				y: scaleY,
			},
		})

		console.log(newImage)

		await newImage.save()

		res
			.status(201)
			.json({ message: "Image created successfully.", id: newImage._id })
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

// PUT: Update Image
router.put("/", auth, async (req: Request, res: Response) => {
	console.log("PUT Image Request")

	try {
		const { id, imageId, posX, posY, scaleX, scaleY } = req.body

		var updateImageId: string,
			updatePosition: boolean = false,
			updateScale: boolean = false

		if (!id && !imageId)
			throw {
				errorMessage: "No image id.",
				status: 406,
			}
		else updateImageId = id

		console.log(`Image ID: ${updateImageId}`)

		if (!posX && !posY && !scaleX && !scaleY)
			throw {
				errorMessage: "No image updates found.",
				status: 406,
			}
		else {
			console.log("Found image updates.")

			if (posX && posY) {
				updatePosition = true
			}

			if (scaleX && scaleY) {
				updateScale = true
			}
		}

		if (!updatePosition && !updateScale)
			throw {
				errorMessage: "No image updates found.",
				status: 406,
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
		if (!ObjectID.isValid(updateImageId))
			throw {
				errorMessage: `Invalid object id.`,
				status: 406,
			}

		console.log("Image ID is valid.")

		// Find a text
		console.log(`Finding an image with id: ${updateImageId}`)

		const imageToUpdate: IImage | Mongoose.Error.CastError | null =
			await ImageModel.findById(
				updateImageId,
				function (err: any, image: typeof ImageModel): void {
					if (err) {
						console.log(`Mongoose Error: ${err.message}`)

						err.serverMessage = err.message
						err.status = 406

						errorResponse(res, err)
					} else {
						console.log("Success...")
					}
				}
			)

		console.log("Found an image:")

		console.log(imageToUpdate)

		// Make sure a text is found.
		if (!imageToUpdate)
			throw {
				errorMessage: `No text item found with id: ${updateImageId}.`,
				status: 404,
			}
		// Check if the current user is the author of the text.
		console.log(`User id: ${userId}, text author id: ${imageToUpdate.author}`)

		if ((userId as string) != (imageToUpdate.author as string)) {
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

		// Check new position
		if (
			updatePosition &&
			imageToUpdate.pos.x === posX &&
			imageToUpdate.pos.y === posY
		) {
			updatePosition = false
			console.log("Similar position.")
		}

		// Check new scale
		if (
			updateScale &&
			imageToUpdate.scale.x === scaleX &&
			imageToUpdate.scale.y === scaleY
		) {
			updateScale = false
			console.log("Similar scale.")
		}

		if (!updateScale && !updatePosition) {
			throw {
				errorMessage:
					"New position and scale is identical to current information.",
				status: 406,
			}
		}

		// Everything should be ok now.
		console.log("Everything should a-okay.")

		// Save new position
		if (updatePosition) {
			imageToUpdate.pos.x = posX
			imageToUpdate.pos.y = posY
		}

		// Save new scale
		if (updateScale) {
			imageToUpdate.scale.x = scaleX
			imageToUpdate.scale.y = scaleY
		}

		// Set edited to true
		imageToUpdate.editInfo.edited = true

		// Set the time of the update
		// textToUpdate.set({ editInfo.lastEditAt: new Date() })

		imageToUpdate.editInfo.lastEditAt = new Date()
		imageToUpdate.editInfo.lastEditBy = userId as string

		// Save the text
		await imageToUpdate.save((err, text) => {
			if (err)
				throw {
					serverMessage: err,
					errorMessage: "Error while saving.",
					status: 500,
				}

			console.log(text)
			res.status(202).json(true)
		})
	} catch (err) {}
})

// GET: Get Image
router.get("/", async (req: Request, res: Response) => {
	try {
		const { id } = req.body

		var getImageId: string

		console.log(id)

		if (!id)
			throw {
				errorMessage: "Please provide an id.",
				status: 406,
			}
		else getImageId = id

		// Valid Id
		if (!ObjectID.isValid(getImageId))
			throw {
				errorMessage: `Invalid object id.`,
				status: 406,
			}

		// Get Text
		const image = await ImageModel.findById(getImageId, (err: any) => {
			if (err)
				throw {
					errorMessage: "Error while finding the image.",
					serverMessage: err.message,
					status: 500,
				}
		})

		if (!image)
			throw {
				errorMessage: "No image found with that id.",
				status: 404,
			}

		const author = await User.findOne({ _id: image.author })

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
		var resImage: IFrontendImage = {
			_id: image._id,
			url: image.url,
			pos: image.pos,
			scale: image.scale,
			author: frontendUser,
			editInfo: image.editInfo,
		}

		console.log("Response Image")
		// console.log(resText)

		res.status(200).json(resImage)

		// Done
	} catch (err) {
		errorResponse(res, err)
	}
})

// DELETE: Delete text
router.delete("/", auth, async (req: Request, res: Response) => {
	console.log("Delete Image Request")

	try {
		const { id } = req.body

		// Check for any id
		if (!id)
			throw {
				errorMessage: "Please provide id.",
				status: 406,
			}

		// Valid Id
		const validId = id

		if (!ObjectID.isValid(validId))
			throw {
				errorMessage: "Invalid id.",
				status: 406,
			}

		// Find a text
		const image = await ImageModel.findById(validId)

		if (!image)
			throw {
				errorMessage: "No image found with that id.",
				status: 404,
			}

		// Check if the authorId matches the Id
		const userId = getIdFromToken(req.cookies.token)

		if ((userId as string) != (image.author as string)) {
			// Not the author

			// Find out if current user is moderator or admin
			const superUser = await User.findOne({ _id: userId })

			if (superUser) {
				const userRole = superUser.role

				if (userRole != Role.Moderator && userRole != Role.Admin) {
					throw {
						errorMessage:
							"Image item found, but it didn't below to you. And you don't have authority",
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
		await ImageModel.deleteOne({ _id: validId }, (err: any) => {
			if (err)
				throw {
					errorMessage: "Something went wrong during deletion.",
					serverMessage: err.message,
					status: 500,
				}
		})

		console.log("Image successfully deleted!")

		res.status(202).json({ message: "Image successfully deleted." })

		// Done
	} catch (err) {
		errorResponse(res, err)
	}
})

// Get all texts
router.get("/getAll/", async (req: Request, res: Response) => {
	console.log("Get all images.")

	try {
		const images = await ImageModel.find()
		console.log(images)

		if (!images)
			throw {
				status: 413,
				errorMessage: "No images found.",
			}

		var resImages: IFrontendImage[] = []

		// Change to FrontendText
		for (var image of images) {
			const author = await User.findOne({ _id: image.author })

			if (!author) continue

			const user: IFrontendUser = {
				_id: author._id,
				username: author.username,
				role: author.role,
			}

			const newImage: IFrontendImage = {
				_id: image._id,
				url: image.url,
				pos: image.pos,
				scale: image.scale,
				author: user,
				editInfo: image.editInfo,
			}

			resImages.push(newImage)
		}

		res.status(200).json(resImages)
	} catch (err: any) {}
})

module.exports = router
