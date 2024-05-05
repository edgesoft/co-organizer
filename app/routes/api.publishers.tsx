import { ActionFunction, json } from "@remix-run/node";
import { prisma } from "~/services/db.server";

async function getPublishersForConvent(name: string, conventId: number) {
  const conventCircuits = await prisma.conventCircuit.findMany({
    where: {
      conventId: conventId,
    },
    select: {
      circuit: true,
    },
  });

  const circuitValues = conventCircuits.map((cc) => cc.circuit);
  const matchingPublishers = await prisma.publisher.findMany({
    where: {
      name: {
        contains: name,
        mode: "insensitive",
      },
      circuit: {
        in: circuitValues,
      },
    },
  });

  return matchingPublishers;
}

export const action: ActionFunction = async ({ request }) => {
  const data = await request.json();
  const d = await getPublishersForConvent(data.name, Number(data.conventId));
  return json(d);
};
