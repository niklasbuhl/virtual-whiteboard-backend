import mongoose, { Schema } from "mongoose"
import Role from "../enums/enum.role"
import IEditInfo from "../interfaces/interface.editInfo"
import IFrontendUser from "../interfaces/interface.frontendUser"
import { IUser } from "./model.user"

export const options = { discriminatorKey: "_t" }

export interface IContent extends Document {
	author: IUser["_id"] | IFrontendUser
	editInfo: IEditInfo
}

const contentSchema = new Schema(
	{
		author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		// author: { type: String, required: true },
		editInfo: {
			createdAt: { type: Date, required: true },
			edited: { type: Boolean, required: false, default: false },
			lastEditAt: { type: Date, required: false, default: undefined },
			lastEditBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		},
	},
	options
)

const Content = mongoose.model<IContent>("Content", contentSchema)

export default Content

/*

export interface IContentMeta {
	authorId: string
	authorName: string
	createdAt: Date
	edited: boolean
	editedAt: Date
	position: {
		x: number
		y: number
		z: number
	}
}

export const contentMetaSchema = new Schema({
	authorId: { type: String, required: true },
	authorName: { type: String, required: true },
	createdAt: { type: Date, required: true },
	edited: { type: Boolean, required: false, default: false },
	editedAt: { type: Date, required: false },
	position: {
		x: { type: Number, required: false, default: 0 },
		y: { type: Number, required: false, default: 0 },
		z: { type: Number, required: false, default: 0 },
	},
})

const MetaContent = mongoose.model<IContentMeta>("Text", contentMetaSchema)

export default MetaContent

const contentSchema = new Schema(
	{
		author: {
			_if: { type: String, required: true },
			username: { type: String, required: true },
			email: { type: String, required: true },
			auth: {
				hash: { type: String, required: true },
				salt: { type: String, required: true },
				pepper: { type: Number, required: true },
			},
			role: { type: Role, required: true, default: "User" },
		},
		editInfo: {
			createdAt: { type: Date, required: true },
			edited: { type: Boolean, required: false, default: false },
			lastEditAt: { type: Date, required: false },
		},
	},
	options
)

*/
