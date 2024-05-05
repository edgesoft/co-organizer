import { LoaderFunction, redirect } from "@remix-run/node";
import { destroySession, getSession } from "~/services/cookie.server";

export const loader: LoaderFunction = async ({ request }) => {
    const session = await getSession(request.headers.get("Cookie"));

     return redirect("/events", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
}