import { LoaderFunction, redirect } from "@remix-run/node";
import { prisma } from "~/services/db.server";

export const loader: LoaderFunction = async ({ params, request }) => {
  if (!params.conventId) {
    return { status: 404, error: "Convent ID not found" };
  }

  const conventId = parseInt(params.conventId, 10);

  if (isNaN(conventId)) {
    return { status: 404, error: "Invalid Convent ID" };
  }

  const convent = await prisma.convent.findFirst({
    where: {
      id: conventId,
    },
  });

  if (!convent) {
    return { status: 404, error: "Convent not found" };
  }

  const isoDate: string = convent.startDate.toISOString().split('T')[0];
  const formattedDateString: string = isoDate.replace(/-/g, '');

  // Kolla om vi redan är på önskad URL, annars omdirigera dit
  const currentUrl = `/schedule/${conventId}/${formattedDateString}`;
  return redirect(currentUrl)
};

export default function () {
  return null;
}
