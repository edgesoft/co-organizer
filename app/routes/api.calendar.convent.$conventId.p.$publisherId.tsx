import { json, LoaderFunction } from "@remix-run/node";
import { PrismaClient, SessionType } from "@prisma/client";
import ical from "ical-generator";

const prisma = new PrismaClient();

export const loader: LoaderFunction = async ({ params }) => {
  const { conventId, userId, publisherId } = params;

  const convent = await prisma.convent.findUnique({
    where: { id: Number(conventId) },
  });

  const publisherSessions = await prisma.publisher.findMany({
    where: {
      id: Number(publisherId),
    },
    include: {
      sessions: {
        include: {
          session: true, // Hämta alla detaljer för varje session
        },
      },
    },
  });

  const calendar = ical({ name: convent?.theme });
  for (const p of publisherSessions) {
    for (const s of p.sessions) {
      const {
        id,
        date,
        startHour,
        startMinutes,
        stopHour,
        stopMinutes,
        theme,
        groupSessionId,
        identifier,
        type,
      } = s.session;
      const baseDate = new Date(date);
      const startDate = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        startHour,
        startMinutes
      );
      const endDate = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        stopHour,
        stopMinutes
      );

      const sessionPublishers = await prisma.sessionPublisher.findMany({
        where: {
          sessionId: id,
        },
        include: {
          publisher: true,
        },
      });

      const publisherNames = sessionPublishers
        .map((sp) => sp.publisher.name)
        .join(", ");
      let podiumPracticeDescription = "";

      if (type === SessionType.PODIUM_PRACTICE) {
        const groupSessions = await prisma.session.findMany({
          where: {
            groupSessionId: groupSessionId,
          },
          include: {
            publishers: {
              include: {
                publisher: true,
              },
            },
          },
        });

        podiumPracticeDescription = "\n\nPodieövning:\n";
        for (const groupSession of groupSessions) {
          if (groupSession.id !== id) {
            for (const sp of groupSession.publishers) {
              podiumPracticeDescription += `- ${sp.publisher.name}: ${groupSession.theme}(${groupSession.identifier})\n`;
            }
          }
        }
      }

      const event = calendar.createEvent({
        start: startDate,
        end: endDate,
        summary: `${theme} (${identifier})`,
        description: publisherNames
          ? `Ansvariga: ${publisherNames}${podiumPracticeDescription}`
          : podiumPracticeDescription,
        timezone: "Europe/Stockholm",
      });
      event.uid(`convent-${conventId}-${publisherId}-${id}`);
    }
  }

  const icsData = calendar.toString();
  return new Response(icsData, {
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": `attachment; filename="convent-${conventId}-${publisherId}.ics"`,
    },
  });
};
