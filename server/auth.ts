import Auth0Strategy from "passport-auth0";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { google } from "googleapis";

if (
  !process.env.AUTH0_DOMAIN ||
  !process.env.AUTH0_CLIENT_ID ||
  !process.env.AUTH0_CLIENT_SECRET ||
  !process.env.BASE_URL
) {
  throw new Error(
    "Auth0 environment variables not provided. Please set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, and BASE_URL"
  );
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

async function upsertUser(profile: any) {
  // Auth0 profile picture is in profile.picture
  // name is in profile.displayName
  // email is in profile.emails[0].value
  // id is in profile.id
  const nameParts = profile.displayName ? profile.displayName.split(" ") : ["", ""];
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ");

  await storage.upsertUser({
    id: profile.id,
    email: profile.emails && profile.emails[0] ? profile.emails[0].value : "",
    firstName: firstName,
    lastName: lastName,
    profileImageUrl: profile.picture,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const strategy = new Auth0Strategy(
    {
      domain: process.env.AUTH0_DOMAIN!,
      clientID: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      callbackURL: `${process.env.BASE_URL}/api/callback`,
      scope:
        "openid profile email offline_access https://www.googleapis.com/auth/photoslibrary.readonly",
    },
    async (accessToken, refreshToken, extraParams, profile, done) => {
      await upsertUser(profile);
      const user = {
        id: profile.id,
        profile,
        accessToken,
        refreshToken,
        expires_at: Date.now() / 1000 + extraParams.expires_in!,
      };
      return done(null, user);
    }
  );

  passport.use(strategy);

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate("auth0", {
      scope:
        "openid profile email offline_access https://www.googleapis.com/auth/photoslibrary.readonly",
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate("auth0", {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      const logoutURL = new URL(`https://${process.env.AUTH0_DOMAIN}/v2/logout`);
      logoutURL.searchParams.set("client_id", process.env.AUTH0_CLIENT_ID!);
      logoutURL.searchParams.set("returnTo", process.env.BASE_URL!);
      res.redirect(logoutURL.toString());
    });
  });

  // Google Photos API endpoint
  app.get("/api/photos", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    if (!user.accessToken) {
      return res
        .status(401)
        .json({ message: "Google access token not available" });
    }

    try {
      // Create an authenticated OAuth2 client
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: user.accessToken });

      // Make a direct HTTP request to the Photos Library API
      const response = await fetch(
        "https://photoslibrary.googleapis.com/v1/mediaItems:search",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pageSize: 30,
            filters: {
              contentFilter: {
                excludedContentCategories: [
                  "DOCUMENTS",
                  "RECEIPTS",
                  "SCREENSHOTS",
                  "TEXT",
                ],
              },
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Google Photos API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const mediaItems = data.mediaItems || [];
      res.json(mediaItems);
    } catch (error: any) {
      console.error("Error fetching Google Photos:", error);
      res
        .status(500)
        .json({
          message: "Failed to fetch Google Photos",
          error: error.message,
        });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // NOTE: no refresh token logic for now, assuming sessions are long enough
  // and that passport-auth0 handles this for us. If not, we'll need to
  // implement it.
  return next();
};
