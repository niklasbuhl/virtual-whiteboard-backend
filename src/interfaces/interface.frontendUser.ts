import Role from "../enums/enum.role"
import IAuth from "./interface.auth"

interface IFrontendUser {
	username: string
	role: Role
	_id: string
}

export default IFrontendUser
