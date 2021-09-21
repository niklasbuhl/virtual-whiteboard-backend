import mongoose, { Schema, Document } from "mongoose"
import Role from "../enums/enum.role"
import IAuth from "../interfaces/interface.auth"
import IFrontendUser from "../interfaces/interface.frontendUser"

export interface IUser extends Document {
	username: string
	email: string
	auth: IAuth
	role: Role
}

const userSchema = new Schema({
	username: { type: String, required: true },
	email: { type: String, required: true },
	auth: {
		hash: { type: String, required: true },
		salt: { type: String, required: true },
		pepper: { type: Number, required: true },
	},
	role: { type: Role, required: true, default: "User" },
})

const User = mongoose.model<IUser>("User", userSchema)

export default User
