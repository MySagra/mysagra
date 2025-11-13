import { TokenPayload } from "@/schemas/auth";


declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}