import { Response } from 'express';
import type { APISuccessResponse, APIErrorResponse } from '@yshvydak-job-screener/shared';

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
            data
        };
        return res.status(statusCode).json(response);
    }

    /**
     * Send a created response (201)
     */
    static created<T>(res: Response, data: T): Response {
        return this.success(res, data, 201);
    }

    /**
     * Send an error response
     */
    static error(
        res: Response,
        error: unknown,
        statusCode: number = 500,
        code?: string
    ): Response {
        const message = error instanceof Error ? error.message : String(error);
        const response: APIErrorResponse = {
            success: false,
            error: message,
            ...(code && { code })
        };
        return res.status(statusCode).json(response);
    }

    /**
     * Send a bad request error (400)
     */
    static badRequest(res: Response, message: string): Response {
        return this.error(res, message, 400, 'BAD_REQUEST');
    }

    /**
     * Send a not found error (404)
     */
    static notFound(res: Response, message: string): Response {
        return this.error(res, message, 404, 'NOT_FOUND');
    }

    /**
     * Send an internal server error (500)
     */
    static internal(res: Response, message: string = 'Internal Server Error'): Response {
        return this.error(res, message, 500, 'INTERNAL_ERROR');
    }

    /**
     * Send a service unavailable error (503)
     */
    static serviceUnavailable(res: Response, message: string): Response {
        return this.error(res, message, 503, 'SERVICE_UNAVAILABLE');
    }
}
