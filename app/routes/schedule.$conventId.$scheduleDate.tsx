import React, { useRef, useEffect, useState, useCallback } from "react";
import pkg from "lodash";
import {
  calculateMinutes,
  calculateVerticalBarPosition,
  formatName,
  getDatesForSchedule,
  getLayerBySessionType,
  getLayerColors,
  hours,
  max,
  maxTimeInPixels,
  min,
  pixelsPerMinute,
  renderTime,
} from "~/utils/helpers";
import { Publisher, Session, SessionStep, SessionType } from "@prisma/client";
import { prisma } from "../services/db.server";
import { Outlet, useLoaderData, useNavigate } from "@remix-run/react";
import { ConventLoaderType, PositionType, SessionProps } from "~/types/types";
import Header from "~/components/header";
import { LoaderFunction, MetaFunction, json, redirect } from "@remix-run/node";
import { verifyUserSession } from "~/services/cookie.server";
import { useAuthRevalidation } from "~/hooks/useAuthRevalidation";
import { useSessionStepRevalidator } from "~/hooks/useSessionStepRevalidator";

const { throttle } = pkg;

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
  let scheduleDate = params.scheduleDate || "";
  if (!params.conventId) {
    return redirect("/events");
  }
  const { user } = await verifyUserSession(request);
  if (!user) {
    return redirect("/");
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

  if (user.role !== "ADMIN") {
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

  if (params.scheduleDate?.length !== 8) {
    const { date } = getDatesForSchedule(convent.startDate);
    scheduleDate = date;
    return redirect(`/schedule/${convent.id}/${date}`);
  } else {
    let s = parseInt(scheduleDate || "", 10);
    if ((s + "").length !== params.scheduleDate?.length) {
      const { date } = getDatesForSchedule(convent.startDate);
      scheduleDate = date;
      return redirect(`/schedule/${convent.id}/${date}`);
    }
  }
  const year = parseInt(scheduleDate.substring(0, 4), 10);
  const month = parseInt(scheduleDate.substring(4, 6), 10) - 1; // Månader är nollbaserade i JavaScript (0 - 11)
  const day = parseInt(scheduleDate.substring(6, 8), 10);
  let dateObject = new Date(year, month, day);

  if (!isSameOrBefore(convent.startDate, convent.endDate, dateObject)) {
    const { date } = getDatesForSchedule(convent.startDate);
    return redirect(`/schedule/${convent.id}/${date}`);
  }

  const { isoDate, date } = getDatesForSchedule(dateObject);
  const sessions = await getSessionForDate(isoDate, convent.id);
  return json({
    sessions,
    convent,
    currentDate: date,
    user,
    env: process.env.CO_ENV,
  });
};

const SessionComponent = (props: SessionProps) => {
  const {
    id,
    startHour,
    startMinutes,
    stopHour,
    stopMinutes,
    type,
    publishers,
  } = props;
  const minutes = calculateMinutes(
    startHour,
    startMinutes,
    stopHour,
    stopMinutes
  );
  const textRef = useRef<HTMLDivElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const dummyRef = useRef<HTMLDivElement>(null);
  const [textHeight, setTextHeight] = useState(0);
  const [position, setPosition] = useState<PositionType>("absolute");

  useEffect(() => {
    if (textRef.current && divRef.current) {
      if (
        type === SessionType.TALK ||
        type === SessionType.MUSIC ||
        type === SessionType.VIDEO ||
        type === SessionType.SKE ||
        type === SessionType.PRAYER
      ) {
        const divRect = divRef.current?.getBoundingClientRect();
        setTextHeight(divRect.height - 20);
      } else {
        const height = textRef.current.getBoundingClientRect().height - 10;
        setTextHeight(height);
      }
    }
  }, [id, type]);

  const colors = getLayerColors(type);

  const updateTextPosition = useCallback(
    throttle(() => {
      if (
        type !== SessionType.TALK &&
        type !== SessionType.MUSIC &&
        type !== SessionType.VIDEO &&
        type !== SessionType.SKE &&
        type !== SessionType.PRAYER
      ) {
        if (divRef.current && textRef.current) {
          const containerRect = divRef.current.getBoundingClientRect();
          const textRect = textRef.current.getBoundingClientRect();
          // TODO: kolla på textRect.height också
          if (containerRect.height > 215) {
            if (containerRect.top < 20) {
              const height = textRect.height + 55;
              setTextHeight(height);
              setPosition(
                textRect.height + 66 > containerRect.bottom
                  ? "absolute"
                  : "sticky"
              );
            } else {
              const height = textRect.height - 10;
              setTextHeight(height);
              setPosition("absolute");
            }
          }
        }
      }
    }, 50),
    [id, type]
  );

  useEffect(() => {
    window.addEventListener("scroll", updateTextPosition);
    updateTextPosition();
    return () => window.removeEventListener("scroll", updateTextPosition);
  }, [updateTextPosition]);

  const topPosition = textHeight > 0 ? textHeight : 0;
  const name =
    publishers && publishers.length
      ? publishers.map((p) => p.publisher.name).join(",")
      : "";

  return (
    <div
      className={colors.background}
      ref={divRef}
      style={{
        maxHeight: pixelsPerMinute * minutes - 6,
        minHeight: pixelsPerMinute * minutes - 6,
        width: 50,
        minWidth: 50,
        maxWidth: 50,
        left: 5,
      }}
    >
      <div ref={dummyRef} className="sticky top-0"></div>
      <div style={{ left: 0, top: 0, position: position, width: 50 }}>
        <div className="relative">
          <div
            ref={textRef}
            className="absolute text-black-500 text-md whitespace-nowrap transform -rotate-90 origin-top-left "
            style={{
              lineHeight: "0.75rem",
              top: topPosition ? topPosition + 12 : 110,
              left: 5,
              width:
                type === SessionType.TALK ||
                type === SessionType.PRAYER ||
                type === SessionType.SKE ||
                type === SessionType.VIDEO ||
                type === SessionType.MUSIC
                  ? textHeight
                  : textRef.current?.getBoundingClientRect().height,
              overflow: "hidden",
              textOverflow: "ellipsis", // Lägg till text-overflow: ellipsis
            }}
          >
            <span
              className="block text-sm"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis", // Lägg till text-overflow: ellipsis
              }}
            >
              {props.theme}
            </span>
            <span className="block">
              <span className="text-xxs pr-1">
                ({renderTime(startHour, startMinutes)}-
                {renderTime(stopHour, stopMinutes)})
              </span>
              <span className="text-sm pr-1"> {formatName(name)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const VerticalBarWithStatus = (props: Session) => {
  const { startHour, startMinutes, type, steps } = props;

  const top = calculateVerticalBarPosition(startHour, startMinutes);
  const colors = getLayerColors(type);

  return (
    <div className="absolute flex items-center justify-center h-screen">
      <div
        className={`relative rounded-sm border-2 ${colors?.border}`}
        style={{ position: "absolute", top: top - 6, left: -10 }}
      >
        <SessionComponent {...props} />

        <div
          className={`absolute top-0 left-0 h-full w-1.5 ${colors?.stepNotDone}`}
        >
          <div
            className={`${colors?.stepDone} h-full`}
            style={{
              height: `${
                type === SessionType.VIDEO || type === SessionType.MUSIC
                  ? 100
                  : (steps.filter((s: SessionStep) => s.isCompleted).length /
                      steps.length) *
                    100
              }%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const renderTimeInterval = (hour: number, index: number) => {
  if (hour >= max) return null; // Förhindra rendering efter max-tiden

  const intervals = [0, 15, 30, 45];
  return intervals
    .map((minute, minuteIndex) => {
      const timeInMinutes = hour * 60 + minute;
      if (timeInMinutes > max * 60) return null; // Stoppa rendering om tiden överstiger max-tiden

      const height =
        minuteIndex === 0
          ? 60 * pixelsPerMinute
          : (intervals[minuteIndex] - intervals[minuteIndex - 1]) *
            pixelsPerMinute; // Beräkna höjden baserat på intervallet mellan tidsstegen

      return (
        <div
          key={minuteIndex}
          className="absolute border-r border-gray-500 bg-slate-200"
          style={{
            height: height + 8,
            width: "100%",
            left: 0,
            top: index * 60 * pixelsPerMinute + minute * pixelsPerMinute,
          }}
        >
          <div className="ml-2 text-sm">{renderTime(hour, minute)}</div>
        </div>
      );
    })
    .filter(Boolean); // Filtrera bort null-värden
};

const ColumnLayout = () => {
  const { sessions, user, env } = useLoaderData<ConventLoaderType>();
  const navigator = useNavigate();
  useAuthRevalidation(env);
  useSessionStepRevalidator();

  return (
    <>
      <Header />
      <Outlet />
      <div className="absolute pt-16 w-full">
        <div className="relative flex h-screen w-full ">
          <div
            className="relative w-16 bg-gray-200 flex-none h-full "
            style={{ width: 60 }}
          >
            {hours.map((hour, index) => (
              <React.Fragment key={index}>
                {renderTimeInterval(hour, index)}
              </React.Fragment>
            ))}
          </div>
          <div className="relative w-full h-screen flex flex-wrap">
            {hours.map((hour, index) => {
              const hourInMinutesStart = hour * 60;
              const hourInMinutesEnd = (hour + 1) * 60;
              if (hourInMinutesStart >= max * 60) return null;

              return (
                <React.Fragment key={index}>
                  {hourInMinutesEnd <= max * 60 && (
                    <>
                      <div
                        className="absolute"
                        style={{ top: index * 60 * pixelsPerMinute }}
                      ></div>
                      <div
                        className="w-full border-b absolute border-gray-500"
                        style={{
                          top: index * 60 * pixelsPerMinute,
                          width: "100%",
                          height: 8,
                        }}
                      />
                    </>
                  )}
                </React.Fragment>
              );
            })}

            {Array.from({ length: 4 }).map((_, i) => {
              return (
                <div
                  key={i}
                  className="relative w-1/4 p-4 border-r border-dashed border-gray-500"
                  style={{
                    maxHeight: `${maxTimeInPixels}px`,
                    minHeight: `${maxTimeInPixels}px`,
                  }}
                >
                  {sessions.map(
                    (e: Session, index: number): JSX.Element | null => {
                      const layer = getLayerBySessionType(e.type);
                      const eventStartInMinutes =
                        e.startHour * 60 + e.startMinutes;
                      const eventEndInMinutes = e.stopHour * 60 + e.stopMinutes;
                      if (
                        layer !== i ||
                        eventEndInMinutes < min * 60 ||
                        eventStartInMinutes > max * 60
                      )
                        return null;
                      return <VerticalBarWithStatus {...e} key={index} />;
                    }
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {user && user.role === "ADMIN" ? (
        <div className="fixed right-5  bottom-6 md:bottom-6">
          <button
            onClick={() => {
              navigator(`./session/new`);
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded-full inline-flex items-center justify-center shadow-lg transform transition duration-150 ease-in-out hover:scale-110"
            style={{ width: "3rem", height: "3rem" }} // Adjust the size as needed
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
