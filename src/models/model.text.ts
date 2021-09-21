import { Schema, Document } from "mongoose"
import Coords from "../interfaces/interface.coords"
import Content, { IContent, options } from "./model.content"

export interface IText extends Document, IContent {
	text: string
	pos: Coords
	version: string
}

const textSchema = new Schema(
	{
		text: { type: String, required: true },
		pos: {
			x: { type: Number, required: true },
			y: { type: Number, required: true },
		},
		version: { type: String, required: false, default: "0.2" },
	},
	options
)

const Text = Content.discriminator<IText>("Text", textSchema)

export default Text
