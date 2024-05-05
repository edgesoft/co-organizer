import { ActionFunction, json } from "@remix-run/node";
import { prisma } from "~/services/db.server";
import { emitter } from "~/services/emitter.server";

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const on = formData.get("on");
    const id = formData.get("id");
    const isCompleted = on === "true";
    await prisma.sessionStep.update({
        where: {
          id: Number(id)
        },
        data: {
          isCompleted
        },
      });
    const res = await  prisma.sessionStep.findFirst({
        where: {
            id: Number(id)
        }
    })

    emitter.emit("message", res);

    return json({res})
  };


  