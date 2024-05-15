import {
  ActionFunction,
  LoaderFunction,
  json,
  redirect,
} from "@remix-run/node";
import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useParams,
} from "@remix-run/react";
import { prisma } from "~/services/db.server";
import { classNames } from "~/utils/classnames";

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

  const session = await prisma.session.findFirst({
    where: { id: Number(params.id) },
  });

  return json({
    session,
  });
};

export let action: ActionFunction = async ({ request, params }) => {
  const data = await request.json();

  await prisma.sessionStep.deleteMany({
    where: {
      sessionId: data.sessionId,
    },
  });

  await prisma.sessionPublisher.deleteMany({
    where: {
      sessionId: Number(data.sessionId),
    },
  });

  await prisma.session.delete({
    where: {
      id: data.sessionId,
    },
  });

  return redirect(`/schedule/${params.conventId}`);
};

export default function Session() {
  const { conventId } = useParams();
  const fetcher = useFetcher();
  let navigate = useNavigate();
  const { session } = useLoaderData();

  const handleDelete = () => {
    fetcher.submit(
      JSON.stringify({
        sessionId: session.id,
      }),
      {
        method: "POST",
        encType: "application/json",
      }
    );
  };

  return (
    <div
      className="backdrop-blur-sm fixed inset-0 bg-opacity-50 z-50 flex justify-center items-center overflow-y-auto"
      style={{
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div className="w-full max-w-lg p-5 bg-white rounded-lg shadow-xl  mt-20 mb-20 relative">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={classNames(
            "absolute right-2 top-5 mr-1 text-2xl font-normal leading-none bg-transparent outline-none focus:outline-none"
          )}
        >
          <span
            onClick={() => {
              navigate("../");
            }}
          >
            ×
          </span>
        </button>
        <div className="mb-4 border-b pb-2">
          <h2 className="text-2xl font-semibold text-gray-800">Ta bort</h2>
        </div>
        <form className="grid grid-cols-1 gap-4 mt-8">
          <div>
            Genom att klick på "Ta bort" kommer{" "}
            <span className="font-bold">{session.theme}</span> att försvinna. Du
            kan inte ångra åtgärden.
          </div>
          <div className="flex items-end justify-end">
            <button
              onClick={handleDelete}
              className="bg-red-700 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
            >
              Ta bort
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
