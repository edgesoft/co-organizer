import { SessionType, StepType } from "@prisma/client";

const renderTime = (hour: number, minute: number) => {
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
};

const calculateMinutes = (
  startHour: number,
  startMinutes: number,
  stopHour: number,
  stopMinutes: number
) => {
  return (stopHour - startHour) * 60 + (stopMinutes - startMinutes);
};

const calculateVerticalBarPosition = (
  startHour: number,
  startMinutes: number
) => {
  const minutesFromStart = (startHour - min) * 60 + startMinutes;
  const verticalBarPosition = minutesFromStart * pixelsPerMinute;
  return verticalBarPosition;
};

function formatName(fullName: String) {
  if (!fullName) return fullName;
  const names = fullName.split(" "); // Delar upp fullständigt namn i delar
  if (names.length > 1 && names.length < 2) {
    const firstNameInitial = names[0][0]; // Tar första bokstaven i förnamnet
    const lastName = names[names.length - 1]; // Tar efternamnet
    return `${firstNameInitial}. ${lastName}`; // Kombinerar första bokstaven med efternamnet
  }
  return fullName; // Returnerar originalnamnet om det inte finns något efternamn
}

const min = 8;
const max = 18;
const pixelsPerMinute = 22;
const hours = Array.from({ length: max - min + 1 }, (_, index) => index + min);
const maxTimeInPixels = (max - min) * 60 * pixelsPerMinute;

export {
  min,
  max,
  pixelsPerMinute,
  hours,
  renderTime,
  calculateMinutes,
  calculateVerticalBarPosition,
  formatName,
  maxTimeInPixels,
};

export const getLayerColors = (type: SessionType) => {
  switch (type) {
    case SessionType.CHAIR_MAN_ROOM:
      return {
        background: "bg-orange-50",
        stepNotDone: "bg-orange-200",
        stepDone: "bg-orange-500",
        border: "border-orange-500",
        text: "text-orange-500",
      };
    case SessionType.CHECKING_SPEAKERS:
      return {
        background: "bg-blue-50",
        stepNotDone: "bg-blue-200",
        stepDone: "bg-blue-500",
        border: "border-blue-500",
        text: "text-blue-500",
      };
    case SessionType.TALK:
      return {
        background: "bg-pink-50",
        stepNotDone: "bg-pink-200",
        stepDone: "bg-pink-500",
        border: "border-pink-500",
        text: "text-pink-500",
      };
    case SessionType.SKE:
      return {
        background: "bg-pink-50",
        stepNotDone: "bg-pink-200",
        stepDone: "bg-pink-500",
        border: "border-pink-500",
        text: "text-pink-500",
      };
    case SessionType.VIDEO:
      return {
        background: "bg-pink-50",
        stepNotDone: "bg-pink-200",
        stepDone: "bg-pink-500",
        border: "border-pink-500",
        text: "text-pink-500",
      };
    case SessionType.MUSIC:
      return {
        background: "bg-pink-50",
        stepNotDone: "bg-pink-200",
        stepDone: "bg-pink-500",
        border: "border-pink-500",
        text: "text-pink-500",
      };
    case SessionType.PODIUM_PRACTICE:
      return {
        background: "bg-teal-50",
        stepNotDone: "bg-teal-200",
        stepDone: "bg-teal-500",
        border: "border-teal-500",
        text: "text-teal-600",
      };
    case SessionType.PRAYER:
      return {
        background: "bg-pink-50",
        stepNotDone: "bg-pink-200",
        stepDone: "bg-pink-500",
        border: "border-pink-500",
        text: "text-pink-500",
      };
    case SessionType.CHAIR_MAN:
      return {
        background: "bg-teal-50",
        stepNotDone: "bg-teal-200",
        stepDone: "bg-teal-500",
        border: "border-teal-500",
        text: "text-teal-600",
      };
  }
};

export const getLayerBySessionType = (type: SessionType) => {
  switch (type) {
    case SessionType.CHAIR_MAN_ROOM:
      return 0;
    case SessionType.CHECKING_SPEAKERS:
      return 1;
    case SessionType.TALK:
    case SessionType.MUSIC:
    case SessionType.VIDEO:
    case SessionType.PODIUM_PRACTICE:
    case SessionType.PRAYER:
    case SessionType.SKE:
      return 2;
    case SessionType.CHAIR_MAN:
      return 3;
  }
};

export const getStepTypeName = (stepType: StepType) => {
  switch (stepType) {
    case StepType.PODIUM_PRACTICE_DONE:
      return "Podieträning";
    case StepType.PRACTICE_DONE:
      return "Övning gjord";
    case StepType.RECEIVED_ASSIGNMENT:
      return "Tackat ja till uppgiften";
    case StepType.REGISTERED_30_MINUTES_BEFORE_SPEAKING:
      return "Anmält sig 30 min före talet";
    case StepType.REGISTERED_ON_FIRST_DAY:
      return "Anmält sig första dagen";
    case StepType.REGISTERED_ON_SPEAKING_DAY:
      return "Anmält sig dagen för talet";
  }
};

export function capitalizeFirstLetter(content: String) {
  return content.charAt(0).toUpperCase() + content.slice(1);
}

export const getDatesForSchedule = (d) => {
  const isoDate: string = new Date(d).toISOString().split("T")[0];
  const formattedDateString: string = isoDate.replace(/-/g, "");

  return { isoDate, date: formattedDateString };
};

export const getDatesInRange = (
  startDate: string | number | Date,
  endDate: string | number | Date
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateList = [];

  for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
    dateList.push(new Date(date));
  }

  return dateList;
};

export type SessionTypeOption = {
  value: SessionType;
  label: string;
};

export const SessionTypeOptions = [
  { value: SessionType.TALK, label: "Tal" },
  { value: SessionType.CHAIR_MAN_ROOM, label: "Ordförande rummet" },
  { value: SessionType.CHECKING_SPEAKERS, label: "Bocka av talare" },
  { value: SessionType.MUSIC, label: "Musik" },
  { value: SessionType.PRAYER, label: "Bön" },
  { value: SessionType.CHAIR_MAN, label: "Sessionsordförande" },
  { value: SessionType.PODIUM_PRACTICE, label: "Podieövning" },
  { value: SessionType.VIDEO, label: "Video" },
  { value: SessionType.SKE, label: "SKE" },
];

export const getSessionType = (
  type: SessionType
): SessionTypeOption | undefined => {
  return SessionTypeOptions.find((f) => f.value === type);
};

export const getDateByDateParam = (scheduleDate: string): Date => {
  const year = parseInt(scheduleDate.substring(0, 4), 10);
  const month = parseInt(scheduleDate.substring(4, 6), 10) - 1; // Månader är nollbaserade i JavaScript (0 - 11)
  const day = parseInt(scheduleDate.substring(6, 8), 10);
  return new Date(year, month, day);
};
