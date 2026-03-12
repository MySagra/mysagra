import { Request, Response, NextFunction } from 'express';
import { TokenService } from '@/modules/auth/token.service';
import { RoleNames } from '@mysagra/schemas';

const tokenService = new TokenService();

export function authenticate(allowedRoles: RoleNames[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if(!user || user.role === "guest"){
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