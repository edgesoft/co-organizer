import { ActionFunction, json } from "@remix-run/node";
import { prisma } from "~/services/db.server";

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id")
    const groupSessionId = formData.get("groupSessionId")
    
    const sessions = await prisma.session.findMany({
        where: {
          groupSessionId: Number(groupSessionId),
          NOT: {
            id: Number(id)
          }
        },
        include: {
            steps: true,
            publishers: {
              include: {
                  publisher: true
              }
          }
          },
        orderBy: [
            { startHour: 'asc' },
            { startMinutes: 'asc' }
          ]
      });
  
    return json({sessions});
  };


  