import crypto from "crypto"
import IAuth from "../interfaces/interface.auth"

// Create a hash from password, salt and pepper
export default function hashing(
	password: string,
	salt: string,
	pepper: number,
): string {
	
    const hash: string = crypto
		.pbkdf2Sync(password, salt, pepper, 64, "sha512")
		.toString("hex")

	return hash
}

// Create new authentication information
export function createNewAuth(password: string): IAuth {
    
    // A bit of salt to fight rainbow tables
	const salt: string = crypto.randomBytes(16).toString("hex")
    
	// And a bit of pepper (how many iterations)
	const pepper: number = 10000 // 0.2s
    
	// 100,000 ~ 2.0s
	// 50,000  ~ 1.0s
	// 25,000  ~ 0.5s
	// 10,000  ~ 0.2s
    
	// Password Hashing
	const hash: string = hashing(password, salt, pepper)

	const auth = {
		salt: salt,
		pepper: pepper,
		hash: hash,
	}

	return auth
}

// Compare password and authentication information
export function compareAuth(
	password: string,
	auth: IAuth
	// salt: string,
	// pepper: number,
	// hash: string
): boolean {
	const newHash: string = crypto
		.pbkdf2Sync(password, auth.salt, auth.pepper, 64, "sha512")
		.toString("hex")

	return newHash === auth.hash
}

module.exports = { createNewAuth, compareAuth }
