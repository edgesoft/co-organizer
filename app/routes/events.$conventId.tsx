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


  const today = new Date(new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' }));
  today.setHours(0, 0, 0, 0);
  let selectedDate = convent.startDate;

  if (today >= convent.startDate && today <= convent.endDate) {
    selectedDate = today;
  }

  const isoDate: string = selectedDate.toISOString().split('T')[0];
  const formattedDateString: string = isoDate.replace(/-/g, '');

  const currentUrl = `/schedule/${conventId}/${formattedDateString}`;
  return redirect(currentUrl)
};

