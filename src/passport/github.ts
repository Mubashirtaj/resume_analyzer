import passport from "passport";
import {
  Strategy as GitHubStrategy,
  Profile as GitHubProfile,
} from "passport-github2";

declare global {
  namespace Express {
    interface User {
      id: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      email?: string;
      photo?: string;
    }
  }
}

const users: Record<string, Express.User> = {};

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: "http://localhost:4000/auth/github/callback",
      scope: ["user:email"],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: GitHubProfile,
      done: (err: any, user?: Express.User) => void
    ) => {
      const names = profile.displayName?.split(" ") || [];
      const user: Express.User = {
        id: profile.id,
        username: profile.username,
        firstName: names[0],
        lastName: names.slice(1).join(" "),
        email: profile.emails?.[0]?.value,
        photo: profile.photos?.[0]?.value,
      };
      users[user.id] = user;
      done(null, user);
    }
  )
);

passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

passport.deserializeUser((id: string, done) => {
  done(null);
});
