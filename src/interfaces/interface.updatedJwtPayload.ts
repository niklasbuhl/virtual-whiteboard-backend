import { JwtPayload } from "jwt-decode"

export default interface IJwtPayloadContent extends JwtPayload {
	user: string
}
