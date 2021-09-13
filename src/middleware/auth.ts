import { Response, Request, NextFunction } from "express"
import jwt from "jsonwebtoken"
import errorResponse from "./errorResponse"
// import jwtDecode from "jwt-decode"
// import IJwtPayloadContent from "../interfaces/interface.updatedJwtPayload"
// import dotenv from 'dotenv'

export default function auth(
	req: Request,
	res: Response,
	next: NextFunction
): any {
	try {
		// Collect token
		const token = req.cookies.token

		if (!token)
			throw {
				errorMessage: "Auth: Didn't receive a token.",
				serverMessage: "Auth: Didn't receive a token.",
				status: 401,
			}

		// Check if the token is verified
		jwt.verify(token, process.env.JWT_SECRET as string)

		// No errors, please continue
		next()

		// Done
	} catch (err) {
		err.errorMessage = "Unauthorized."
		err.serverMessage = "Person with unauthorized token tried to log in."
		err.status = 401
		err.forceLogOut = true

		errorResponse(res, err)
	}
}
