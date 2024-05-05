import { ActionFunction, json, redirect } from "@remix-run/node";
import { commitSession, getSession } from "~/services/cookie.server";
import admin from "~/services/firebase.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const idToken = formData.get("idToken");
 
  const session = await getSession(request.headers.get("Cookie"));
  if (process.env.CO_ENV === "development") {
    const idToken = session.get("idToken");
    return json({}, {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } else {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (decodedToken == null) {
      return json({error: "Felaktig användare"}, {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }
  
    session.set("idToken", idToken);
  
    return json({}, {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }
  
  
};
