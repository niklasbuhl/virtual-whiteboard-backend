import { Schema, Document } from "mongoose"
import Content, { IContent, options } from "./model.content"

export interface IDrawing extends Document, IContent {
	content: {
		points: {
			type: [
				{
					x: number
					y: number
				}
			]
		}
	}
}

const drawingSchema = new Schema(
	{
		content: {
			points: [
				{
					x: { type: Number, required: true },
					y: { type: Number, required: true },
				},
			],
		},
	},
	options
)

const Drawing = Content.discriminator<IDrawing>("Drawing", drawingSchema)

export default Drawing
