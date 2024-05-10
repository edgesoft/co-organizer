import { ActionFunction, json } from "@remix-run/node";
import { prisma } from "~/services/db.server";

export const action: ActionFunction = async ({ request }) => {
  try {
    const data = await request.json();

    if (!data.id) {
      return json({});
    }

    const sessionStep = await prisma.sessionStep.findUnique({
      where: { id: data.id },
      include: { session: true },
    });

    if (!sessionStep || !sessionStep.sessionId) {
      return json({});
    }

    const groupSessionId = sessionStep.session.groupSessionId;

    if (!groupSessionId) {
      return json({});
    }

    const podiumPracticeSession = await prisma.session.findFirst({
      where: {
        groupSessionId,
        type: "PODIUM_PRACTICE",
      },
    });

    if (!podiumPracticeSession) {
      return json({});
    }

    return json(podiumPracticeSession);
  } catch (error) {
    console.error("An error occurred:", error);
    return json({ error: "An error occurred while processing your request." }, 500);
  }
};
