/**
 * User entity types
 * Simple single-role system - all users are equal
 */

export interface User {
    id: string
    email: string
    password_hash: string
    created_at: string
    updated_at: string
}

export interface CreateUserDTO {
    email: string
    password: string
}

export interface UpdateUserDTO {
    email?: string
    password?: string
}

export interface UserResponse {
    id: string
    email: string
    created_at: string
    updated_at: string
}

/**
 * Helper to convert User to UserResponse (without password_hash)
 */
export function toUserResponse(user: User): UserResponse {
    return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
    }
}
