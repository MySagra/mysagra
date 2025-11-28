import { Request, Response, NextFunction } from 'express';
import { TokenService } from '@/services/token.service';
import { TokenPayload } from '@/schemas/auth';
import { UserRole } from '@/schemas/auth';

const tokenService = new TokenService();

export function authenticate(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if(!user){
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
}