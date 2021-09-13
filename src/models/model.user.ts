import mongoose, { Schema, Document } from "mongoose"

export interface IUser extends Document {
	username: string
	email: string
	auth: {
		hash: string
		salt: string
		pepper: number
	}
	rank: string
}

const userSchema = new Schema({
	username: { type: String, required: true },
	email: { type: String, required: true },
	auth: {
		hash: { type: String, required: true },
		salt: { type: String, required: true },
		pepper: { type: Number, required: true },
	},
	rank: { type: String, required: true, default: "User" },
})

const User = mongoose.model<IUser>("User", userSchema)

export default User
