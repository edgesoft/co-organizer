import { SessionType, StepType } from "@prisma/client";
import { ActionFunction, json } from "@remix-run/node";
import { prisma } from "~/services/db.server";

export const action: ActionFunction = async ({ request }) => {
  const data = await request.json();


  const sessions = await prisma.session.findMany({
    where: {
      conventId: Number(data.conventId),
      AND: [
        {
          OR: [
            { groupSessionId: null },
            { groupSessionId: data.groupSessionId }
          ]
        },
        {
          steps: {
            some: {
              stepType: StepType.PODIUM_PRACTICE_DONE
            }
          }
        },
        {
          OR: [
            { type: SessionType.TALK },
            { type: SessionType.PRAYER },
            { type: SessionType.CHAIR_MAN }
          ]
        }
      ]
    },
    orderBy: [{ startHour: "asc" }, { startMinutes: "asc" }],
  });
  
  return json(sessions);
};
