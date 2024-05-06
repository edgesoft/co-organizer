import {
  Role,
  Session,
  SessionStep,
  SessionType,
  StepType,
} from "@prisma/client";
import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useRevalidator,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import {
  capitalizeFirstLetter,
  getLayerColors,
  renderTime,
} from "~/utils/helpers";
import StepItem from "./stepItem";
import { useEventSource } from "remix-utils/sse/react";
import { useUpdateSessionStepEvent } from "~/hooks/useUpdateSessionStepEvent";
import { classNames } from "~/utils/classnames";

const PodiumPraticeStep = ({ session }: { session: Session }) => {
  const [currentSteps, setCurrentSteps] = useState<SessionStep[]>([]);
  const {
    identifier,
    id,
    steps,
    type,
    theme,
    date,
    startHour,
    stopHour,
    startMinutes,
    stopMinutes,
    participants,
    publishers,
  } = session;
  const co = getLayerColors(type);
  const day = capitalizeFirstLetter(
    new Date(date).toLocaleDateString("sv-SE", { weekday: "long" })
  );
  const practiceStep = steps.find(
    (f) => f.stepType === StepType.PODIUM_PRACTICE_DONE
  );

  const names = publishers
    ? publishers.map((p) => p.publisher.name).join(", ")
    : "";

  useUpdateSessionStepEvent(id, steps, (newSteps: SessionStep[]) => {
    setCurrentSteps(newSteps);
  });

  useEffect(() => {
    setCurrentSteps(steps);
  }, [id, steps]);

  return (
    <div key={id} className="text-sm bg-white p-2 rounded-md shadow-md mb-2">
      <div className="flex flex-row items-center">
        <div
          style={{ height: 60, minWidth: 6 }}
          className={`${co?.background}`}
        >
          <div
            className={`h-full  border ${co?.stepNotDone} rounded-sm ${co?.border}`}
          >
            <div
              className={`${co?.stepDone} h-full`}
              style={{
                height: `${
                  (currentSteps.filter((e) => e.isCompleted).length /
                    currentSteps.length) *
                  100
                }%`,
              }}
            ></div>
          </div>
        </div>
        <div className="flex flex-col pl-2">
          <div
            className={`flex ${names && names.length ? "" : "text-red-700"}`}
          >
            {names || `Inte tilldelat`}{" "}
            <span className="pl-1 mt-0.5 text-xs">({identifier})</span>
          </div>
          <div className="flex">{theme}</div>
          {participants ?  <p className="text-sm text-gray-500">Medverkande: {participants}</p>: null}
          <p className="text-sm text-gray-500">{`${day}, ${renderTime(
            startHour,
            startMinutes
          )} - ${renderTime(stopHour, stopMinutes)}`}</p>
        </div>
        <div className="ml-auto">
          {practiceStep && names && names.length ? (
            <StepItem
              step={practiceStep}
              disabled={false}
              onEvent={(id, on) => {
                setCurrentSteps(
                  currentSteps.map((s) => {
                    return {
                      ...s,
                      isCompleted: s.id === id ? on : s.isCompleted,
                    };
                  })
                );
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
const PodiumPraticeComponent = ({ sessions }: { sessions: Session[] }) => {
  if (!sessions) return null;

  return sessions.map((session) => {
    return <PodiumPraticeStep key={session.id} session={session} />;
  });
};

const useProgressSteps = (session: Session, steps: SessionStep[]) => {
  const { groupSessionId, id, type } = session;
  const fetcher = useFetcher();
  const lastMessageId = useEventSource("/session-step", {
    event: "session-step",
  });

  let completedProgress =
    steps && steps.length > 0
      ? (steps.filter((e) => e.isCompleted).length / steps.length) * 100
      : 1 * 100;

  useEffect(() => {
    if (groupSessionId && type === SessionType.PODIUM_PRACTICE) {
      try {
        fetcher.submit(
          { groupSessionId: groupSessionId, id: id },
          { action: "/groupSearch", method: "post" }
        );
      } catch (e) {}
    }
  }, [id, groupSessionId, type, lastMessageId]);

  if (
    fetcher.data &&
    fetcher.data.sessions &&
    type === SessionType.PODIUM_PRACTICE
  ) {
    const s = fetcher.data.sessions.reduce(
      (acc, session) => {
        const p = session.steps.find(
          (f) => f.stepType === StepType.PODIUM_PRACTICE_DONE
        );

        if (p.isCompleted) {
          acc["done"] = acc["done"] + 1;
        }
        return acc;
      },
      { count: fetcher.data ? fetcher.data.sessions.length : 0, done: 0 }
    );

    completedProgress = (s.done / s.count) * 100;
  }

  return [
    completedProgress,
    fetcher.data && fetcher.data.sessions ? fetcher.data.sessions : [],
  ];
};

const SearchResultItem = (props: Session) => {
  const {
    id,
    theme,
    startHour,
    stopHour,
    type,
    date,
    stopMinutes,
    startMinutes,
    steps,
    identifier,
    participants,
    publishers,
  } = props;
  const [detail, showDetail] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<SessionStep[]>(steps);
  const { user } = useLoaderData();
  const navigate = useNavigate();

  useUpdateSessionStepEvent(id, currentSteps, (newSteps: SessionStep[]) => {
    setCurrentSteps(newSteps);
  });

  const [completedProgress, sessions] = useProgressSteps(props, currentSteps);

  useEffect(() => {
    setCurrentSteps(steps);
  }, [id, steps]);

  const day = capitalizeFirstLetter(
    new Date(date).toLocaleDateString("sv-SE", { weekday: "long" })
  );
  const colors = getLayerColors(type);

  const isStepEnabled = (stepType: StepType) => {
    if (user.role !== Role.ADMIN && user.role !== Role.WORKER) return false;
    if (!publishers.length) return false;
    if (stepType === StepType.RECEIVED_ASSIGNMENT && user.role !== Role.ADMIN) {
      return false;
    }

    if (stepType !== StepType.RECEIVED_ASSIGNMENT) {
      const ra = currentSteps.find((c) => c.stepType === StepType.RECEIVED_ASSIGNMENT)
      if (ra && !ra.isCompleted) {
        return false
      }
    }

    return true;
  };

  return (
    <div className={`border-b last:border-b-0  ${detail ? "bg-gray-50" : ""}`}>
      <div
        className={`p-4 flex cursor-pointer`}
        onClick={() => {
          if (type === SessionType.VIDEO || type === SessionType.MUSIC)
            return false;
          if (user.role === Role.PROGRAM) {
            if (type === SessionType.PODIUM_PRACTICE) {
              showDetail(!detail);
            }
            return false;
          }
          showDetail(!detail);
        }}
      >
        <div
          style={{ height: 100, width: 10 }}
          className={`${colors?.background}`}
        >
          <div
            className={`h-full  border ${colors?.stepNotDone} rounded-sm ${colors?.border}`}
          >
            <div
              className={`${colors?.stepDone} h-full`}
              style={{
                height: `${
                  type === SessionType.VIDEO || type === SessionType.MUSIC
                    ? 100
                    : completedProgress
                }%`,
              }}
            ></div>
          </div>
        </div>
        <div className="pl-2">
          {type !== SessionType.MUSIC && (
            <div className="flex">
              <h3
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (user.role !== Role.ADMIN) return false;
                  navigate(`./session/${id}/user`);
                  return false;
                }}
                style={
                  user.role === Role.ADMIN
                    ? {
                        textDecoration: "underline",
                        textDecorationStyle: "dashed",
                      }
                    : {}
                }
                className={classNames(
                  (publishers.length &&
                    publishers.length > 0 &&
                    completedProgress > 0) ||
                    type == SessionType.VIDEO
                    ? ""
                    : "text-red-700",
                  "font-semibold text-lg"
                )}
              >
                {publishers.length && publishers.length > 0
                  ? publishers
                      .map(
                        (p: { publisher: { name: string } }) => p.publisher.name
                      )
                      .join(", ")
                  : type === SessionType.VIDEO
                  ? "Video"
                  : "Inte tilldelat"}
              </h3>
              <span className="pl-1 mt-1 text-sm">({identifier})</span>
            </div>
          )}

          <p className="text-gray-600">{theme}</p>
          {participants ?  <p className="text-sm text-gray-600">Medverkande: {participants}</p> : null}
          <p className="text-sm text-gray-500">{`${day}, ${renderTime(
            startHour,
            startMinutes
          )} - ${renderTime(stopHour, stopMinutes)}`}</p>
          {user.role === Role.ADMIN && type !== SessionType.VIDEO ? (
            <button
              className="mt-1 rounded-md shadow-md bg-red-700 text-white px-2 py-1 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 text-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`./session/${id}/delete`);
              }}
            >
              Ta bort
            </button>
          ) : null}
        </div>
      </div>
      {detail && (
        <div className="p-2">
          {type === SessionType.PODIUM_PRACTICE && (
            <PodiumPraticeComponent sessions={sessions} />
          )}

          {(user.role === Role.ADMIN || user.role === Role.WORKER) &&
            currentSteps.map((step, index) => {
              return (
                <div key={index}>
                  <StepItem
                    step={step}
                    disabled={!isStepEnabled(step.stepType)}
                    onEvent={(id, on) => {
                      setCurrentSteps(
                        currentSteps.map((s) => {
                          return {
                            ...s,
                            isCompleted: s.id === id ? on : s.isCompleted,
                          };
                        })
                      );
                    }}
                  />
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default SearchResultItem;
