import { json, LoaderFunction } from '@remix-run/node';
import { PrismaClient } from '@prisma/client';
import ical from 'ical-generator';

const prisma = new PrismaClient();

export const loader: LoaderFunction = async ({ params }) => {
    const { conventId, userId, publisherId } = params;

    const convent = await prisma.convent.findUnique({where: {id: Number(conventId)}});

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

    const calendar = ical({ name: convent?.theme});
    for (const p of publisherSessions) {
        for (const s of p.sessions) {
          const { id, date, startHour, startMinutes, stopHour, stopMinutes, theme, identifier } = s.session;
          const baseDate = new Date(date);
          const startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), startHour, startMinutes);
          const endDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), stopHour, stopMinutes);

          const sessionPublishers = await prisma.sessionPublisher.findMany({
            where: {
              sessionId: id,
            },
            include: {
              publisher: true,
            }
          });

          const publisherNames = sessionPublishers.map(sp => sp.publisher.name).join(", ");

          const event = calendar.createEvent({
              start: startDate,
              end: endDate,
              summary: `${theme} (${identifier})`,
              description: publisherNames ? `Ansvariga: ${publisherNames}`: "",
              timezone: 'Europe/Stockholm'
          });
          event.uid(`convent-${conventId}-${publisherId}-${id}`);
        }
    }

    const icsData = calendar.toString();
    return new Response(icsData, {
        headers: {
            'Content-Type': 'text/calendar',
            'Content-Disposition': `attachment; filename="convent-${conventId}-${publisherId}.ics"`
        }
    });
};
