import { SessionStep } from "@prisma/client";
import { useEffect } from "react";
import { useEventSource } from "remix-utils/sse/react";

export const useUpdateSessionStepEvent = (
  sessionId: number,
  steps: SessionStep[],

  callback: (steps: SessionStep[]) => void
) => {
  let lastMessageId = useEventSource("/session-step", {
    event: "session-step",
  });

  useEffect(() => {
    if (lastMessageId) {
      const s = JSON.parse(lastMessageId);
      if (s.sessionId === sessionId) {
        callback(
          steps.map((e: SessionStep) => {
            return {
              ...e,
              isCompleted: s.id === e.id ? s.isCompleted : e.isCompleted,
            };
          })
        );
      }
    }
  }, [lastMessageId]);
};
