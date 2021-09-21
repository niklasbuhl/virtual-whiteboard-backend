import Coords from "./interface.coords"
import IEditInfo from "./interface.editInfo"
import IFrontendUser from "./interface.frontendUser"

interface IFrontendImage {
	_id: string
	url: string
	pos: Coords
	scale: {
		x: number
		y: number
	}
	author: IFrontendUser
	editInfo: IEditInfo
}

export default IFrontendImage
