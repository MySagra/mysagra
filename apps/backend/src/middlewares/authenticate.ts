import { Request, Response, NextFunction } from 'express';
import { TokenService } from '@/modules/auth/token.service';
import { RoleNames } from '@mysagra/schemas';
import { ApiKeyPrefix } from '@mysagra/schemas';

const tokenService = new TokenService();

export function authenticate(allowedRoles: RoleNames[] = [], allowedApiKeys: ApiKeyPrefix[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    const apiKeyValid =
      req.apiKey &&
      allowedApiKeys.length > 0 &&
      allowedApiKeys.includes(req.apiKey.prefix);

    if (apiKeyValid) return next();

    const userValid =
      user &&
      user.role !== "guest" &&
      allowedRoles.includes(user.role);

    if (userValid) return next();

    const hasIdentity = req.apiKey || (user && user.role !== "guest");

    if (!hasIdentity) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    res.status(403).json({ message: "Insufficient permissions" });
    return;
  };
}