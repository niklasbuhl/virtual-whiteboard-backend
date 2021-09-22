import express, { Request, Response } from "express"
import getIdFromToken from "../functions/getIdFromToken"
import auth from "../middleware/auth"
import User from "../models/model.user"
import Mongoose from "mongoose"
import { ObjectID } from "mongodb"
import errorResponse from "../middleware/errorResponse"
import Role from "../enums/enum.role"
import IFrontendUser from "../interfaces/interface.frontendUser"
import IFrontendImage from "../interfaces/interface.frontendImage"
import Path, { IPath } from "../models/model.path"
import IFrontendPath from "../interfaces/interface.frontendPath"
import { FormatInputPathObject } from "path"

const router = express.Router()

// POST: Create new path
router.post("/", auth, async (req: Request, res: Response) => {
	console.log("POST Image Request")

	// path
	// x
	// y

	try {
		const { pathStr, x, y } = req.body

		if (!pathStr)
			throw {
				status: 204,
				errorMessage: "No path string.",
			}

		if (!x && !y)
			throw {
				status: 204,
				errorMessage: "No path position.",
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
		const newPath: IPath = new Path({
			path: pathStr,
			author: author._id,
			editInfo: {
				createdAt: createdAt,
			},
			pos: {
				x: x,
				y: y,
			},
			originPos: {
				x: x,
				y: y,
			},
		})

		console.log(newPath)

		await newPath.save()

		res
			.status(201)
			.json({ message: "Path created successfully.", id: newPath._id })
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

// PUT: Update Path
router.put("/", auth, async (req: Request, res: Response) => {
	console.log("PUT Path Request")

	try {
		const { id, x, y } = req.body

		var updatePathId: string,
			updatePosition: boolean = false

		if (!id)
			throw {
				errorMessage: "No path id.",
				status: 406,
			}
		else updatePathId = id

		console.log(`Path ID: ${updatePathId}`)

		if (!x && !y)
			throw {
				errorMessage: "No path updates found.",
				status: 406,
			}
		else {
			console.log("Found path updates.")

			if (x && y) {
				updatePosition = true
			}
		}

		if (!updatePosition)
			throw {
				errorMessage: "No path updates found.",
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
		if (!ObjectID.isValid(updatePathId))
			throw {
				errorMessage: `Invalid object id.`,
				status: 406,
			}

		console.log("Path ID is valid.")

		// Find a text
		console.log(`Finding an path with id: ${updatePathId}`)

		const pathToUpdate: IPath | Mongoose.Error.CastError | null =
			await Path.findById(
				updatePathId,
				function (err: any, image: typeof Path): void {
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

		console.log("Found an path:")

		console.log(pathToUpdate)

		// Make sure a text is found.
		if (!pathToUpdate)
			throw {
				errorMessage: `No path item found with id: ${updatePathId}.`,
				status: 404,
			}
		// Check if the current user is the author of the text.
		console.log(`User id: ${userId}, path author id: ${pathToUpdate.author}`)

		if ((userId as string) != (pathToUpdate.author as string)) {
			// Not the author

			// Find out if current user is moderator or admin
			const superUser = await User.findOne({ _id: userId })

			if (superUser) {
				const userRole = superUser.role

				if (userRole != Role.Moderator && userRole != Role.Admin) {
					throw {
						errorMessage:
							"Path item found, but it didn't below to you. And you don't have authority",
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
			pathToUpdate.pos.x === x &&
			pathToUpdate.pos.y === y
		) {
			updatePosition = false
			console.log("Similar position.")
		}

		if (!updatePosition) {
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
			pathToUpdate.pos.x = x
			pathToUpdate.pos.y = y
		}

		// Set edited to true
		pathToUpdate.editInfo.edited = true

		// Set the time of the update
		// textToUpdate.set({ editInfo.lastEditAt: new Date() })

		pathToUpdate.editInfo.lastEditAt = new Date()
		pathToUpdate.editInfo.lastEditBy = userId as string

		// Save the text
		await pathToUpdate.save((err, text) => {
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

// GET: Get Path
router.get("/", async (req: Request, res: Response) => {
	try {
		const { id } = req.body

		var getPathId: string

		if (!id)
			throw {
				errorMessage: "Please provide an id.",
				status: 406,
			}
		else getPathId = id

		// Valid Id
		if (!ObjectID.isValid(getPathId))
			throw {
				errorMessage: `Invalid object id.`,
				status: 406,
			}

		// Get Path
		const path = await Path.findById(getPathId, (err: any) => {
			if (err)
				throw {
					errorMessage: "Error while finding the path.",
					serverMessage: err.message,
					status: 500,
				}
		})

		if (!path)
			throw {
				errorMessage: "No path found with that id.",
				status: 404,
			}

		const author = await User.findOne({ _id: path.author })

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
		var resPath: IFrontendPath = {
			_id: path._id,
			path: path.path,
			pos: path.pos,
			originPos: path.originPos,
			author: frontendUser,
			editInfo: path.editInfo,
		}

		// console.log("Response Text")
		// console.log(resText)

		res.status(200).json(resPath)

		// Done
	} catch (err) {
		errorResponse(res, err)
	}
})

// DELETE: Delete path
router.delete("/", auth, async (req: Request, res: Response) => {
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
		const path = await Path.findById(validId)

		if (!path)
			throw {
				errorMessage: "No path found with that id.",
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

		if ((userId as string) != (path.author as string)) {
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
		await Path.findByIdAndRemove(
			validId,
			null,
			(err: any, path: IPath | null) => {
				if (err)
					throw {
						errorMessage: "Something went wrong during deletion.",
						serverMessage: err.message,
						status: 500,
					}
			}
		)

		res.status(202).json({ message: "Path successfully deleted." })

		// Done
	} catch (err) {
		errorResponse(res, err)
	}
})

// Get all texts
router.get("/getAll/", async (req: Request, res: Response) => {
	console.log("Get all paths.")

	try {
		const paths = await Path.find()
		console.log(paths)

		if (!paths)
			throw {
				status: 413,
				errorMessage: "No texts found.",
			}

		var resPaths: IFrontendPath[] = []

		// Change to FrontendText
		for (var path of paths) {
			const author = await User.findOne({ _id: path.author })

			if (!author) continue

			const user: IFrontendUser = {
				_id: author._id,
				username: author.username,
				role: author.role,
			}

			const newPath: IFrontendPath = {
				_id: path._id,
				path: path.path,
				pos: path.pos,
				originPos: path.originPos,
				author: user,
				editInfo: path.editInfo,
			}

			resPaths.push(newPath)
		}

		res.status(200).json(resPaths)
	} catch (err: any) {}
})

module.exports = router
