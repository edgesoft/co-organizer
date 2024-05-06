import { json, LoaderFunction } from '@remix-run/node';
import { PrismaClient } from '@prisma/client';
import ical from 'ical-generator';

const prisma = new PrismaClient();

export const loader: LoaderFunction = async ({ params }) => {
    const { conventId, userId, publisherId } = params;

    const convent = await prisma.convent.findUnique({where: {id: Number(conventId)}})
    console.log(convent)
    const publisher = await prisma.publisher.findUnique({where: {id: Number(publisherId)}})

    const publisherSessions = await prisma.publisher.findMany({
        where: {
          id: Number(publisherId),
        },
        include: {
          sessions: {
            include: {
              session: true, // Hämta alla detaljer för varje session
            }
          }
        }
      });




    // Skapa en ny kalender
    const calendar = ical({ name: convent?.theme});

    console.log(publisherSessions)

    // Lägg till events till kalendern
    publisherSessions.forEach(p => {
        console.log(p)
        const  sessions = p.sessions
        console.log(sessions)


        sessions.forEach(s => {
          const { date, startHour, startMinutes, stopHour, stopMinutes, theme, identifier } = s.session;
          const baseDate = new Date(date);
          const startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), startHour, startMinutes);
          const endDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), stopHour, stopMinutes);
      
  
          calendar.createEvent({
              start: startDate,
              end: endDate,
              summary: `${theme} (${identifier})`,
              description: "test",
          });
        })
      
    });

    // Generera ICS-filen
    const icsData = calendar.toString();

    // Ställ in rätt headers för ICS-filen
    return new Response(icsData, {
        headers: {
            'Content-Type': 'text/calendar',
            'Content-Disposition': `attachment; filename="convent-${conventId}-${publisherId}.ics"`
        }
    });
};

