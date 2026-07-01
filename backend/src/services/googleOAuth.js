import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.js';

export function configureGoogleStrategy() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const user = await User.findOneAndUpdate(
            { email },
            {
              name: profile.displayName,
              email,
              avatar: profile.photos?.[0]?.value,
              provider: 'google'
            },
            { upsert: true, new: true }
          );
          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );
}
