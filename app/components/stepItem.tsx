import { SessionType, StepType } from "@prisma/client";
import { useFetcher } from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSessionStepEvent } from "~/hooks/useSessionStepEvent";
import { StepProps } from "~/types/types";
import { classNames } from "~/utils/classnames";
import {
  capitalizeFirstLetter,
  getStepTypeName,
  renderTime,
} from "~/utils/helpers";

const StepName = ({ id, stepType, isGroup }: { id: number; stepType: StepType, isGroup: boolean }) => {
  const fetcher = useFetcher();

  if (isGroup || stepType !== StepType.PODIUM_PRACTICE_DONE)
    return getStepTypeName(stepType);

  useEffect(() => {
    if (id) {
      try {
        fetcher.submit(
          { id },
          {
            action: "/api/practice",
            method: "post",
            encType: "application/json",
          }
        );
      } catch (e) {}
    }
  }, [id]);

  if (
    fetcher &&
    fetcher.data 
  ) {
    const day = capitalizeFirstLetter(
      new Date(fetcher.data.date).toLocaleDateString("sv-SE", {
        weekday: "long",
      })
    );
    return (
      <>
        Podieträning {day},{" "}
        {renderTime(fetcher.data.startHour, fetcher.data.startMinutes)} -{" "}
        {renderTime(fetcher.data.stopHour, fetcher.data.stopMinutes)}
      </>
    );
  }

  return getStepTypeName(stepType);
};

const StepItem: React.FC<StepProps> = ({
  isGroup = false,
  step,
  onEvent,
  disabled,
}): JSX.Element => {
  const { isCompleted, id, stepType } = step;
  const [on, setOn] = useState(isCompleted);
  const fetcher = useFetcher();
  useSessionStepEvent(step, (s) => {
    setOn(s.isCompleted);
  });

  return (
    <fetcher.Form
      method="post"
      action="/step"
      onSubmit={(e) => e.preventDefault()}
    >
      <span
        onClick={() => {
          if (disabled) return;
          setOn(!on);
          fetcher.submit({ on: !on, id }, { action: "/step", method: "post" });
          onEvent(id, !on);
        }}
        className={classNames(
          "relative mb-1 mr-1 cursor-pointer inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 transition-all duration-200 select-none",
          `${
            on
              ? disabled
                ? "bg-emerald-100 text-emerald-300"
                : "bg-emerald-100 text-emerald-800"
              : disabled
              ? "bg-slate-100 text-slate-300"
              : "bg-slate-100 text-slate-400"
          }`
        )}
      >
        <div className={classNames("mr-1 -mt-0.5 flex")}>
          <label className="flex cursor-pointer">
            <input type="hidden" name="_action" value={"disable"} />
            <input type="submit" name="id" style={{ display: "none" }} />
            <div
              className="relative top-1 -left-0.5"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (disabled) return;
                setOn(!on);
                fetcher.submit(
                  { on: !on, id },
                  { action: "/step", method: "post" }
                );
                onEvent(id, !on);
              }}
            >
              <input type="checkbox" className="sr-only" />
              <div
                className={classNames(
                  "block  h-4 w-6 rounded-full transition-all duration-200",
                  `${
                    on
                      ? disabled
                        ? "bg-emerald-200"
                        : "bg-emerald-600"
                      : disabled
                      ? "bg-slate-300"
                      : "bg-slate-400"
                  }`
                )}
              ></div>
              <AnimatePresence initial={false}>
                <motion.div
                  transition={{
                    delay: 0.13,
                    type: "spring",
                    stiffness: 8000,
                    damping: 20,
                  }}
                  animate={{ left: on ? 3 : 12 }}
                  className={classNames(
                    "dot absolute top-1 h-2 w-2 rounded-full bg-white transition"
                  )}
                ></motion.div>
              </AnimatePresence>
            </div>
          </label>
        </div>
        <StepName id={id} isGroup={isGroup} stepType={stepType} />
      </span>
    </fetcher.Form>
  );
};

export default StepItem;
