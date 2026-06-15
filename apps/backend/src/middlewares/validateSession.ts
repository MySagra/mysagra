import { Request, Response, NextFunction } from "express"
import { UnauthorizedError } from "@/common/errors";
import { sessionsService } from "@/modules/auth/sessions.service";

export async function validateSession(req: Request, _res: Response, next: NextFunction) {
    const sessionId = req.cookies.mysagra_session;

    if(!sessionId) {
        req.user = undefined
        return next();
    }

    const payload = await sessionsService.getSessionPayload(sessionId);

    if (!payload) {
        throw new UnauthorizedError("Session expired or logged out")
    }

    req.user = payload
    next();
}