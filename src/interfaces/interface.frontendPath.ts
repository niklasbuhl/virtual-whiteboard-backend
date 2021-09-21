import Coords from "./interface.coords"
import IEditInfo from "./interface.editInfo"
import IFrontendUser from "./interface.frontendUser"

interface IFrontendPath {
	_id: string
	path: string
	pos: Coords
	author: IFrontendUser
	editInfo: IEditInfo
}

export default IFrontendPath
