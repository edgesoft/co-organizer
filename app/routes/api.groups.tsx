import { SessionType } from "@prisma/client";
import { ActionFunction, json } from "@remix-run/node";
import { prisma } from "~/services/db.server";

export const action: ActionFunction = async ({ request }) => {
  const data = await request.json();

  const sessions = await prisma.session.findMany({
    where: {
     conventId: Number(data.conventId),
      groupSessionId: null,
      OR: [
        { type: SessionType.TALK },
        { type: SessionType.PRAYER },
        { type: SessionType.CHAIR_MAN }
      ]
    }
  });
  return json(sessions);
};
