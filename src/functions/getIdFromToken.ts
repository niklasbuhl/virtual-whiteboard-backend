import jwtDecode from "jwt-decode"
import IJwtPayloadContent from "../interfaces/interface.updatedJwtPayload"

export default function getIdFromToken(token: string): string | boolean {
	try {
		return jwtDecode<IJwtPayloadContent>(token).user
	} catch {
		return false
	}
}
