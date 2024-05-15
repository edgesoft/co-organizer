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

  const currentUrl = `/schedule/${conventId}`;
  return redirect(currentUrl)
};

export default function () {
  return null;
}
