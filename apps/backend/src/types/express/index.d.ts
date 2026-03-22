import { TokenPayload } from "@/schemas/auth";
import { ApiKeyPrefixValue } from "@mysagra/schemas";


declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      apiKey?: {
        prefix: ApiKeyPrefixValue;
        rawKey: string;
      };
      validated?: {
        query?: any;
        body?: any;
        params?: any;
      }
    }
  }
}