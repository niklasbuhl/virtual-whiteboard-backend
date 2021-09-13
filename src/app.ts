import express, { Request, Response, NextFunction } from "express"
// import jwt from 'jsonwebtoken'
// import * as dotenv from 'dotenv'
require("dotenv").config({ path: __dirname + "/.env" })
import cookieParser from "cookie-parser"
import cors from "cors"
import mongoose from "mongoose"

// ---
console.log("Hello World! ")

// --- App

// Create app
const app = express()

// Setup listening port
const PORT: number = parseInt(process.env.PORT as string)
app.listen(PORT, () => console.log(`Server started on port: ${PORT}`))

// Need to change res.body from int to json
app.use(express.json())

// Parse cookies into an object
app.use(cookieParser())

// Open all ports for communication
const originUrls: [string] = [process.env.FRONTEND_IP as string]

console.log("Allowed URLs: " + originUrls)

app.use(
	cors({
		// origin: [(process.env.FRONTEND_IP as string)],
		// allowedHeaders: [
		// 	"Origin",
		// 	"X-Requested-With",
		// 	"Content-Type",
		// 	"Accept",
		// 	"X-Access-Token",
		// ],
		origin: originUrls,
		credentials: true,
		// methods: "GET, POST, PUT, DELETE",
		// preflightContinue: false,
	})
)

// --- Connect to MongoDB
mongoose.connect(
	process.env.MONGODB_CONNECTION_STRING as string,
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
	},
	(err) => {
		if (err) return console.error(err)
		console.log("Connected to MongoDB with Mongoose")
	}
)

// --- Routes
app.get("/api", (req: Request, res: Response) => {
	res.json({
		message: "Welcome to the Virtual Whiteboard API",
	})
})

// Users
app.use("/api/user", require("./routers/router.user"))

// Login
app.use("/api", require("./routers/router.login"))

// Text Content
app.use("/api/text", require("./routers/router.text"))

// Image Content

// Drawing Content

// Testing
app.use("/test", require("./routers/router.test"))
