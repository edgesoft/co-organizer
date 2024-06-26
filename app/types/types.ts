import { Convent, Publisher, Session, SessionStep, User } from "@prisma/client";

export type PositionType = "absolute" | "relative" | "fixed" | "sticky";

export type StepProps = {
  step: SessionStep;
  disabled: boolean;
  isGroup: boolean;
  onEvent: (id: number, isCompleted: boolean) => void;
};


export type SessionProps = Omit<Session, ''> & {
  steps: SessionStep[];
  publishers: Publisher[]
}

export type ConventLoaderType = {
  user: User;
  convent: Convent;
  sessions: SessionProps[];
  env: string;
  currentDate: {
    date: string
    isoDate: Date
  }
};


export type HeaderProps = {
  onKeyDown: (searchTerm: string) => void;
};