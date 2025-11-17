import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
} from "passport-google-oauth20";
import {
  Strategy as GitHubStrategy,
  Profile as GitHubProfile,
} from "passport-github2";
import { prisma } from "../config/prisma-client";
import dotenv from "dotenv";
import { createAccessToken, createRefreshToken } from "../utils/jwt";
dotenv.config();
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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        "https://kinley-paleogenetic-genoveva.ngrok-free.dev/auth/google/callback",
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: GoogleProfile,
      done: (err: any, user?: Express.User) => void
    ) => {
      try {
        const email = profile.emails?.[0]?.value!;
        const name = profile.displayName!;
        const profileimg = profile.photos?.[0]?.value || "";
        const provider = "google";

        const user = await prisma.user.upsert({
          where: { email },
          update: { name, profileimg, provider, Isverified: true },
          create: { name, email, profileimg, provider, Isverified: true },
        });
        const accessToken = createAccessToken({
          id: user.id,
          name,
          profileimg,
        });
        const refreshToken = createRefreshToken({ id: user.id });

        done(null, {
          id: user.id,
          name: user.name,
          email: user.email,
          profileimg: user.profileimg,
          provider: user.provider,
          Isverified: user.Isverified,
          accessToken,
          refreshToken,
        });
      } catch (err) {
        done(err);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL:
        "https://kinley-paleogenetic-genoveva.ngrok-free.dev/auth/github/callback",
      scope: ["user:email"],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: GitHubProfile,
      done: (err: any, user?: Express.User) => void
    ) => {
      try {
        const email =
          profile.emails?.[0]?.value || `${profile.username}@github.com`; // fallback
        const name = profile.displayName || profile.username || "unknown";
        const profileimg = profile.photos?.[0]?.value || "";
        const provider = "github";

        const user = await prisma.user.upsert({
          where: { email },
          update: { name, profileimg, provider, Isverified: true },
          create: { name, email, profileimg, provider, Isverified: true },
        });
        const accessToken = createAccessToken({
          id: user.id,
          name,
          profileimg,
        });
        const refreshToken = createRefreshToken({ id: user.id });

        done(null, {
          id: user.id,
          name: user.name,
          email: user.email,
          profileimg: user.profileimg,
          provider: user.provider,
          Isverified: user.Isverified,
          accessToken,
          refreshToken,
        });
      } catch (err) {
        done(err);
      }
    }
  )
);

passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return done(null, null);

    const safeUser = {
      ...user,
      refreshToken: user.refreshToken ?? undefined,
    };

    done(null, safeUser);
  } catch (err) {
    done(err);
  }
});

export default passport;
