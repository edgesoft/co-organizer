import {
  Link,
  MetaFunction,
  json, useLoaderData
} from "@remix-run/react";
import { Icon } from "./_index";
import { prisma } from "~/services/db.server";
import { Convent } from "@prisma/client";
import { verifyUserSession } from "~/services/cookie.server";
import { redirect } from "react-router";
import { LoaderFunction } from "@remix-run/node";
import { useAuthRevalidation } from "~/hooks/useAuthRevalidation";

export let meta: MetaFunction = (d) => {
  return [
    {
      title: `Sammankomster`,
    },
    {
      name: "description",
      content: `Sammankomster`,
    },
    {
      property: "twitter:image",
      content: `/logo2.png`,
    },
    {
      property: "og:image",
      content: `/logo2.png`,
    },
  ];
};

export const loader: LoaderFunction = async ({ request }) => {
  const { user } = await verifyUserSession(request);
  if (!user) {
    return redirect("/");
  }
  const events = await prisma.convent.findMany({});
  return json({ events, user, env: process.env.CO_ENV });
};

type EventsProps = {
  events: Convent[];
  env: string;
};

export default function Events() {
  const { events, env } = useLoaderData<EventsProps>();
  useAuthRevalidation(env);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 px-4">
      <header className="w-full bg-slate-900 text-white py-2 px-2 fixed top-0 z-50 border-b border-slate-700">
        <div className="p-1">
          <Icon />
        </div>
      </header>
      <div className="bg-slate-900 p-2 min-h-screen mt-28">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {events.map((event) => (
            <Link
              to={`/events/${event.id}`}
              key={event.id}
              className="block rounded-lg transform transition duration-500 hover:scale-105 overflow-hidden"
              style={{ margin: 0, padding: 0 }}
            >
              <img
                src={event.image || ""}
                alt={event.theme || ""}
                className="w-full h-auto"
              />
              <div className="p-4 bg-white">
                <h3 className="font-semibold text-lg text-gray-700">
                  {event.theme}
                </h3>
                <p className="text-gray-700">{event.description ? event.description : event.location}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
