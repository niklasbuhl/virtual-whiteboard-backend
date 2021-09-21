import Coords from "./interface.coords"
import IEditInfo from "./interface.editInfo"
import IFrontendUser from "./interface.frontendUser"

interface IFrontendText {
	_id: string
	text: string
	pos: Coords
	author: IFrontendUser
	editInfo: IEditInfo
}

export default IFrontendText
