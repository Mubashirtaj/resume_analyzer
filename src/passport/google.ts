import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:4000/auth/google/callback",
    },
    (_accessToken, _refreshToken, profile, done) => {
      const user = {
        id: profile.id,
        firstName: profile.name?.givenName || "",
        lastName: profile.name?.familyName || "",
        fullName: profile.displayName,
        email: profile.emails?.[0]?.value || "",
        image: profile.photos?.[0]?.value || "",
      };

      return done(null, user);
    }
  )
);

export default passport;
