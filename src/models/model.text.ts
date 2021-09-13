import mongoose, { Schema, Document } from "mongoose"
import Content, { IContent, options } from "./model.content"

export interface IText extends Document, IContent {
	content: string
}

const textSchema = new Schema(
	{
		content: { type: String, required: true },
	},
	options
)

const Text = Content.discriminator<IText>("Text", textSchema)

export default Text
