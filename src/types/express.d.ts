import { User as PrismaUser } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: string;
      name?: string;
      email?: string;
      profileimg?: string;
      provider?: string;
      Isverified?: boolean;
      refreshToken?: string;
      accessToken?: string;
    }
  }
}
export interface TokenPayload {
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
