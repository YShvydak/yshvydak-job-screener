import {Response} from 'express'
import type {APISuccessResponse, APIErrorResponse} from '@yshvydak-job-screener/shared'

/**
 * ResponseHelper - Standardized API response formatting
 * Ensures all API responses follow the same structure
 */
export class ResponseHelper {
    /**
     * Send a successful response
     */
    static success<T>(res: Response, data: T, statusCode: number = 200): Response {
        const response: APISuccessResponse<T> = {
            success: true,
            data,
        }
        return res.status(statusCode).json(response)
    }

    /**
     * Send a created response (201)
     */
    static created<T>(res: Response, data: T): Response {
        return this.success(res, data, 201)
    }

    /**
     * Send an error response
     */
    static error(res: Response, error: unknown, statusCode: number = 500, code?: string): Response {
        const message = error instanceof Error ? error.message : String(error)

        let finalStatusCode = statusCode
        let finalCode = code

        // Automatically detect common error types from message if status is default 500
        if (statusCode === 500) {
            const lowerMessage = message.toLowerCase()
            if (lowerMessage.includes('not found')) {
                finalStatusCode = 404
                finalCode = finalCode || 'NOT_FOUND'
            } else if (
                lowerMessage.includes('unauthorized') ||
                lowerMessage.includes('authentication')
            ) {
                finalStatusCode = 401
                finalCode = finalCode || 'UNAUTHORIZED'
            }
        }

        const response: APIErrorResponse = {
            success: false,
            error: message,
            ...(finalCode && {code: finalCode}),
        }
        return res.status(finalStatusCode).json(response)
    }

    /**
     * Send a bad request error (400)
     */
    static badRequest(res: Response, message: string): Response {
        return this.error(res, message, 400, 'BAD_REQUEST')
    }

    /**
     * Send a not found error (404)
     */
    static notFound(res: Response, message: string): Response {
        return this.error(res, message, 404, 'NOT_FOUND')
    }

    /**
     * Send an unauthorized error (401)
     */
    static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
        return this.error(res, message, 401, 'UNAUTHORIZED')
    }

    /**
     * Send an internal server error (500)
     */
    static internal(res: Response, message: string = 'Internal Server Error'): Response {
        return this.error(res, message, 500, 'INTERNAL_ERROR')
    }

    /**
     * Send a server error (500) - alias for internal
     */
    static serverError(res: Response, message: string = 'Server Error'): Response {
        return this.internal(res, message)
    }

    /**
     * Send a service unavailable error (503)
     */
    static serviceUnavailable(res: Response, message: string): Response {
        return this.error(res, message, 503, 'SERVICE_UNAVAILABLE')
    }
}
