export class ApiError extends Error {
    public readonly statusCode: number
    public readonly isOperational: boolean

    constructor(message: string, statusCode: number, isOperational = true) {
        super(message)
        this.statusCode = statusCode
        this.isOperational = isOperational
        this.name = this.constructor.name

        Error.captureStackTrace(this, this.constructor);
    }
}


export class BadRequestError extends ApiError {
    constructor(message: string = "Bad Request") {
        super(message, 400)
    }
}

export class NotFoundError extends ApiError {
    constructor(message: string = "Not Found") {
        super(message, 404)
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message: string = "Unauthorized") {
        super(message, 401)
    }
}

export class ForbiddenError extends ApiError {
    constructor(message: string = "Forbidden") {
        super(message, 403)
    }
}

export class ConflictError extends ApiError {
    constructor(message: string = "Conflict") {
        super(message, 409)
    }
}

export class InternalServerError extends ApiError {
    constructor(message: string = "Internal Server Error") {
        super(message, 500, false)
    }
}

export class ValidationError extends ApiError {
    constructor(message: string = "Validation Error") {
        super(message, 400)
    }
}

export class TooManyRequestsError extends ApiError {
    constructor(message: string = "Too many requests") {
        super(message, 429)
    }
}

// Helper function to check if an error is operational
export const isApiError = (error: unknown): error is ApiError => {
    return error instanceof ApiError;
}