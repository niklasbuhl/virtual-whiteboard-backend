import { Schema, Document } from "mongoose"
import Coords from "../interfaces/interface.coords"
import Content, { IContent, options } from "./model.content"

export interface IPath extends Document, IContent {
	path: string
	pos: Coords
	version: string
}

const pathSchema = new Schema(
	{
		path: { type: String, required: true },
		pos: {
			x: { type: String, required: true },
			y: { type: String, required: true },
		},
		version: { type: String, required: false, default: "0.1" },
	},
	options
)

const Path = Content.discriminator<IPath>("Path", pathSchema)

export default Path
