import { SessionPayload } from "@mysagra/schemas";
import { ApiKeyPrefixValue } from "@mysagra/schemas";


declare global {
  namespace Express {
    interface Request {
      user?: SessionPayload;
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