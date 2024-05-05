import { SessionStep } from "@prisma/client";

export type PositionType = "absolute" | "relative" | "fixed" | "sticky";
export type StepProps = {
    step: SessionStep,
    disabled: boolean,
    onEvent: (id: number, isCompleted: boolean) => void;
  }
  