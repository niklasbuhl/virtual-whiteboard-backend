import { Schema, Document } from "mongoose"
import Coords from "../interfaces/interface.coords"
import Content, { IContent, options } from "./model.content"

export interface IImage extends Document, IContent {
	url: string
	pos: Coords
	scale: {
		x: number
		y: number
	}
	version: string
}

const imageSchema = new Schema(
	{
		url: { type: String, required: true },
		pos: {
			x: { type: Number, required: true },
			y: { type: Number, required: true },
		},
		scale: {
			x: { type: Number, required: false, default: 1 },
			y: { type: Number, required: false, default: 1 },
		},
		version: { type: String, required: false, default: "0.1" },
	},
	options
)

const ImageModel = Content.discriminator<IImage>("Image", imageSchema)

export default ImageModel
