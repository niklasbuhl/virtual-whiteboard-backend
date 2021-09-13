import mongoose, { Schema } from "mongoose"

export const options = { discriminatorKey: "_t" }

export interface IContent {
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

const contentSchema = new Schema(
	{
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

*/
