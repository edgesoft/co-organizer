import { SessionStep } from "@prisma/client";
import { useRevalidator } from "@remix-run/react";
import { useEffect } from "react";
import { useEventSource } from "remix-utils/sse/react";

export const useSessionStepRevalidator = ()  => {
  let { revalidate } = useRevalidator();
  let lastMessageId = useEventSource("/session-step", {
    event: "session-step",
  });

  useEffect(() => revalidate, [lastMessageId]);

};
