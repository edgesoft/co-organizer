import { createCookieSessionStorage } from "@remix-run/node"; // or cloudflare/deno
import admin from "./firebase.server";
import { prisma } from "./db.server";

type SessionData = {
  phoneNumber: string;
  idToken: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: "__session",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
      secrets: ["s3cret1"],
      secure: true,
    },
  });

const verifyUserSession = async (request: Request) => {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session) {
    return { user: null, decodedToken: null };
  }

  const idToken = session.get("idToken");
  if (!idToken) {
    return { user: null, decodedToken: null };
  }

  // ignore firebase where environment is development
  if (process.env.CO_ENV === "development") {
    // in development we set phoneNumber as idToken
    const user = await prisma.user.findFirst({
      where: { phoneNumber: idToken || "" },
    });
    if (!user) {
      return { user: null, decodedToken: null };
    }

    return { decodedToken: idToken, user };
  } else {
    // production
    try {
      // Verifiera idToken med Firebase Admin SDK
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      if (!decodedToken) {
        return { user: null, decodedToken: null };
      }

      const user = await prisma.user.findFirst({
        where: { phoneNumber: decodedToken.phone_number || "" },
      });
      if (!user) {
        return { user: null, decodedToken: null };
      }

      return { decodedToken, user };
    } catch (error) {
      console.error("Error verifying idToken:", error);
      return { user: null, decodedToken: null };
    }
  }
};

export { getSession, commitSession, destroySession, verifyUserSession };
