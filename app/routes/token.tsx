import { ActionFunction, json, redirect } from "@remix-run/node";
import { commitSession, getSession } from "~/services/cookie.server";
import { prisma } from "~/services/db.server";
import admin from "~/services/firebase.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  let phoneNumber = formData.get("phoneNumber") || "";
  const idToken = formData.get("idToken");
  if (!phoneNumber.toString().startsWith("+46")) {
    phoneNumber = `+46${phoneNumber.toString().substring(1,10)}`
  }
  // this is the first check if phone number exists
  if (phoneNumber && !idToken) {

    const user = await prisma.user.findFirst({where: {phoneNumber}})
    if (!user) {
      return json({error: `${phoneNumber} hittades inte för någon användare`})
    }
    const userConvents = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        userConvents: {
          select: {
            convent: true,
          },
        },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let events = userConvents?.userConvents.map(userConvent => userConvent.convent) || []
    if (user.role !== 'ADMIN') {
      events = events.filter(event => {
        const endDate = new Date(event.endDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate >= today;
      });
    }
  
  
    if (!events.length) {
      return json({error: `Inga event kopplade till ${phoneNumber}`})
    }


   return json({user})
  }

  // next check if we got idToken from Firebase or if env is development
  const session = await getSession(request.headers.get("Cookie"));
  if (process.env.CO_ENV === "development") {
    console.log(phoneNumber)

    session.set("idToken", phoneNumber);
    return redirect("/events", {
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
  
    // Login succeeded, send them to the home page.
    return redirect("/events", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }
  
};
