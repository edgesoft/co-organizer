import { ActionFunction, json } from "@remix-run/node";
import { prisma } from "~/services/db.server";

export const action: ActionFunction = async ({ request, params }) => {
    const formData = await request.formData();
    const searchTerm = formData.get("searchTerm");
    const conventId = formData.get("conventId");
    const results = await prisma.session.findMany({
      where: {
        AND: [
          { conventId: Number(conventId) },
          {
            OR: [
              { identifier: { contains: searchTerm, mode: "insensitive" } },
              { theme: { contains: searchTerm, mode: "insensitive" } },
              {
                publishers: {
                  some: {
                    publisher: {
                      name: { contains: searchTerm, mode: "insensitive" },
                    },
                  },
                },
              },
            ],
          },
        ],
      },
      include: {
        steps: true,
        publishers: {
          include: {
            publisher: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startHour: 'asc' },
        { startMinutes: 'asc' }
      ]
    });
  
    return json({ results });
  };


  