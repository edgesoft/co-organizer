import { SessionStep } from "@prisma/client";
import { useEffect } from "react";
import { useEventSource } from "remix-utils/sse/react";

export const useSessionStepEvent = (
  step: SessionStep,
  callback: (step: SessionStep) => void
) => {
  let lastMessageId = useEventSource("/session-step", {
    event: "session-step",
  });

  useEffect(() => {
    if (lastMessageId) {
      const s = JSON.parse(lastMessageId);
      if (s.id === step.id) {
        callback(s);
      }
    }
  }, [lastMessageId]);
};
