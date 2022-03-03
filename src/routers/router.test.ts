import express, { Response, Request } from "express"

const router = express.Router()

router.get("/tryCatch", async (req: Request, res: Response) => {
	try {
		let message: string = "Hello, World"

		const { success } = req.body

		if (!success)
			throw { status: 500, errorMessage: "Something went terribly wrong." }

		res.status(200).json({ message: message })
	} catch (err: any) {
		console.log(err)

		res
			.status(err.status)
			.json({ message: err.message, errorMessage: err.errorMessage })
	}
})

module.exports = router
