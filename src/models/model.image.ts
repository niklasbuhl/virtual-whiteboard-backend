import { Schema, Document } from "mongoose"
import Content, { IContent, options } from "./model.content"

export interface IImage extends Document, IContent {
	content: {
		title: string
		filename: string
		alt: string
		h: number
		w: number
		data: string
	}
}

const imageSchema = new Schema(
	{
		content: {
			title: { type: String, required: true },
			filename: { type: String, required: true },
			alt: { type: String, required: false },
			h: { type: Number, required: true },
			w: { type: Number, required: true },
			data: { type: String, required: true },
		},
	},
	options
)

const Image = Content.discriminator<IImage>("Text", imageSchema)

export default Image
