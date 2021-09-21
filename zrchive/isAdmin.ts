import jwtDecode from "jwt-decode"
import IJwtPayloadContent from "../interfaces/interface.updatedJwtPayload"
import User from "../models/model.user"
// import dotenv from 'dotenv'


export default async function isAdmin(token: string): Promise<Boolean> {
	try {

		// Decode JWT token
		const decoded = jwtDecode<IJwtPayloadContent>(token)

		// Get the rank of the user id
		const rank = await User.find({ _id: decoded.user }).rank

		if (rank != "Admin") throw "User is not 'admin'"

		return true

	} catch (err) {
		console.error(err)
		return false

	}
}
