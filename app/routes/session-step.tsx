import { LoaderFunction } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { emitter } from "~/services/emitter.server";


export const loader: LoaderFunction = async ({ request }) => {
  return eventStream(request.signal, function setup(send) {
    function handle(message: string) {
      send({ event: "session-step", data: JSON.stringify(message) });
    }

    emitter.on("message", handle);

    return function clear() {
      emitter.off("message", handle);
    };
  });
}