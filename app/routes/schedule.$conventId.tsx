import { getDatesForSchedule } from "~/utils/helpers";
import { prisma } from "../services/db.server";
import { Outlet, useLoaderData, useNavigate } from "@remix-run/react";
import { ConventLoaderType } from "~/types/types";
import Header from "~/components/header";
import { LoaderFunction, MetaFunction, json, redirect } from "@remix-run/node";
import { verifyUserSession } from "~/services/cookie.server";
import { useAuthRevalidation } from "~/hooks/useAuthRevalidation";
import { useSessionStepRevalidator } from "~/hooks/useSessionStepRevalidator";
import SearchResultItem from "~/components/searchResultItem";
import { Role } from "@prisma/client";
import { useState } from "react";

async function getSessionForDate(date: string, id: number) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);


  
  return prisma.session.findMany({
    where: {
      conventId: id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      steps: true,
      publishers: {
        include: {
          publisher: true,
        },
      },
    },
    orderBy: [{ date: "asc" }, { startHour: "asc" }, { startMinutes: "asc" }],
  });
}
function isSameOrBefore(startDate: Date, endDate: Date, dateToCheck: Date) {
  let startYear = startDate.getFullYear();
  let startMonth = startDate.getMonth();
  let startDay = startDate.getDate();

  let endYear = endDate.getFullYear();
  let endMonth = endDate.getMonth();
  let endDay = endDate.getDate();

  let checkYear = dateToCheck.getFullYear();
  let checkMonth = dateToCheck.getMonth();
  let checkDay = dateToCheck.getDate();

  if (
    checkYear < startYear ||
    (checkYear === startYear && checkMonth < startMonth) ||
    (checkYear === startYear &&
      checkMonth === startMonth &&
      checkDay < startDay)
  ) {
    return false;
  } else if (
    checkYear > endYear ||
    (checkYear === endYear && checkMonth > endMonth) ||
    (checkYear === endYear && checkMonth === endMonth && checkDay > endDay)
  ) {
    return false;
  } else {
    return true;
  }
}

export let meta: MetaFunction = (d) => {
  const { convent } = d.data;
  const { startDate, endDate } = convent;
  return [
    {
      title: `${convent.theme}`,
    },
    {
      name: "description",
      content: `Sammankomst - ${convent.theme} (${convent.location} ${
        getDatesForSchedule(startDate).isoDate
      } - ${getDatesForSchedule(endDate).isoDate})`,
    },
    {
      property: "twitter:image",
      content: `${convent.image}`,
    },
    {
      property: "og:image",
      content: `${convent.image}`,
    },
  ];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  if (!params.conventId) {
    return redirect("/events");
  }
  const { user } = await verifyUserSession(request);
  if (!user) {
    return redirect(`/?conventId=${params.conventId}`);
  }

  const conventId = parseInt(params.conventId, 10);

  if (isNaN(conventId)) {
    return redirect("/events");
  }

  const conventConditions: any = {
    userId: user.id,
    conventId: conventId,
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (user.role !== Role.ADMIN) {
    conventConditions.convent = {
      endDate: {
        gte: today,
      },
    };
  }

  const userConvent = await prisma.userConvent.findFirst({
    where: conventConditions,
    include: {
      convent: true,
    },
  });

  if (!userConvent) {
    return redirect("/events");
  }

  const convent = userConvent.convent;
  const sessionFilter: any = {
    conventId: convent.id,
  };

  if (user.role === Role.PROGRAM) {
    sessionFilter.identifier = {
      startsWith: "P",
    };
  }


  const sessions = await prisma.session.findMany({
    where: sessionFilter,
    include: {
      steps: true,
      publishers: {
        include: {
          publisher: true,
        },
      },
    },
    orderBy: [{ date: "asc" }, { startHour: "asc" }, { startMinutes: "asc" }],
  });
  return json({
    sessions,
    convent,
    user,
    env: process.env.CO_ENV,
  });
};

const ColumnLayout = () => {
  const { sessions, user, env } = useLoaderData<ConventLoaderType>();
  const navigator = useNavigate();
  useAuthRevalidation(env);
  useSessionStepRevalidator();
  const [filter, setFilter] = useState<string>("")

  return (
    <>
      <Header onKeyDown={(searchTerm) => setFilter(searchTerm)}/>
      <Outlet />
      <div className="absolute pt-16 w-full">
        <div className="relative flex flex-col h-screen w-full">
        {sessions
          .filter((f) => {
            if (filter.length) {
              const lowerCaseFilter = filter.toLowerCase();
              const matchIdentifier = f.identifier.toLowerCase().includes(lowerCaseFilter);
              const matchTheme = f.theme.toLowerCase().includes(lowerCaseFilter);
              const matchPublisherName = f.publishers && f.publishers.length && f.publishers.some(p =>
                p.publisher.name.toLowerCase().includes(lowerCaseFilter)
              );
              const matchPublisherCongregation = f.publishers && f.publishers.length && f.publishers.some(p =>
                p.publisher.congregation.toLowerCase().includes(lowerCaseFilter)
              );
              return matchIdentifier || matchTheme || matchPublisherName || matchPublisherCongregation;
            }
            return true;

          })
          .map((s) => {
            return (
              <div key={s.id} className="flex flex-row border rounded-md ml-1 mr-1 mt-1">
                <SearchResultItem {...s} />
              </div>
            );
          })}
        </div>
      </div>
      {user && user.role === Role.ADMIN ? (
        <div className="fixed right-2  bottom-4 md:bottom-4">
          <button
            onClick={() => {
              navigator(`./session/new`);
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded-full inline-flex items-center justify-center shadow-lg transform transition duration-150 ease-in-out hover:scale-110"
            style={{ width: "3rem", height: "3rem" }}
          >
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      ) : null}
    </>
  );
};

export default ColumnLayout;
