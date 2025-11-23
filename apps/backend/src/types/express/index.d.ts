import { TokenPayload } from "@/schemas/auth";


declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      validated?: {
          query?: any;
          body?: any;
          params?: any;
      }
    }
  }
}