import { SessionType, StepType } from "@prisma/client";
import { ActionFunction, json } from "@remix-run/node";
import { prisma } from "~/services/db.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const id = formData.get("id");
  const groupSessionId = formData.get("groupSessionId");


  // get all remaining
  if (!groupSessionId) {
    const conventId = formData.get("conventId");
    const sessions = await prisma.session.findMany({
      where: {
        groupSessionId: null,
        conventId: Number(conventId),
        type: {
          in: [SessionType.PRAYER, SessionType.TALK, SessionType.CHAIR_MAN],
        },
        steps: {
          some: {
            stepType: StepType.PODIUM_PRACTICE_DONE,
          },
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
      orderBy: [{ startHour: "asc" }, { startMinutes: "asc" }],
    });

    return json({ sessions });
  }

  const sessions = await prisma.session.findMany({
    where: {
      groupSessionId: Number(groupSessionId),
      NOT: {
        id: Number(id),
      },
      steps: {
        some: {
          stepType: StepType.PODIUM_PRACTICE_DONE,
        },
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
    orderBy: [{ startHour: "asc" }, { startMinutes: "asc" }],
  });

  return json({ sessions });
};
