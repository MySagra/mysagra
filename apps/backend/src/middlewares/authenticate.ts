import { Token } from '@/types/token';
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '@/services/token.service';
import { decode } from 'jsonwebtoken';


declare global {
  namespace Express {
    interface Request {
      user?: string;
    }
  }
}

const tokenService = new TokenService();

export function authenticate(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Access token required" });
      return;
    }
    
    const token = authHeader.split(" ")[1];
    let payload = tokenService.getPayload(token);

    if (!payload) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }

    if (!roles.includes(payload.role)) {
      res.status(401).json({ error: "Insufficient permissions" });
      return;
    }

    req.user = JSON.stringify(payload);
    next();
  };
}