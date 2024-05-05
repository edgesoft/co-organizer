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
import { MouseEventHandler, useEffect, useState } from "react";
import { prisma } from "~/services/db.server";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AsyncSelect from "react-select/async";
import { type OptionsOrGroups } from "react-select";
import { classNames } from "~/utils/classnames";
import { Bounce, toast } from "react-toastify";

interface OptionType {
  value: string;
  label: string;
  id: string;
  name: string;
  congregation: string;
  circuit: string;
  circuitSection: string;
}

interface GroupType {
  label: string;
  options: OptionType[];
}

const formSchema = z.object({
  action: z.string().min(1),
  publishers: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .optional(),
  publisher: z
    .object({
      id: z.string().optional(),
      name: z.string().min(1, { message: "Du måste fylla i namn" }),
      congregation: z.string(),
      circuit: z.string().min(1, { message: "Du måste fylla i kretsen" }),
      circuitSection: z.string().optional(),
    })
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

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
  const sessionPublishers = await prisma.sessionPublisher.findMany({
    where: {
      sessionId: Number(params.id),
    },
    include: {
      publisher: true,
    },
  });

  return json({
    session,
    publishers: sessionPublishers.map((p) => ({
      label: p.publisher.name,
      value: p.publisher.id.toString(),
    })),
  });
};

export let action: ActionFunction = async ({ request, params }) => {
  const data = await request.json();

  try {
    const result = formSchema.parse(data);

    switch (result.action) {
      case "publishers":
        await prisma.sessionPublisher.deleteMany({
          where: {
            sessionId: Number(params.id),
          },
        });

        if (result.publishers) {
          const sessionPublishersData = result.publishers.map((publisher) => ({
            publisherId: Number(publisher.value),
            sessionId: Number(params.id),
          }));

          await prisma.sessionPublisher.createMany({
            data: sessionPublishersData,
          });
          return redirect(
            `/schedule/${params.conventId}/${params.scheduleDate}`
          );
        }

      case "publisher":
        const { publisher } = result;

        if (publisher) {
          if (publisher.id) {
            await prisma.publisher.update({
              where: {
                id: Number(publisher.id),
              },
              data: {
                name: publisher.name,
                circuit: publisher.circuit,
                congregation: publisher.congregation,
                circuitSection: publisher.circuitSection,
              },
            });
            return json({ success: true, publisher, update: true });
          } else {
            const p = await prisma.publisher.create({
              data: {
                name: publisher.name,
                circuit: publisher.circuit,
                congregation: publisher.congregation,
                circuitSection: publisher.circuitSection,
              },
            });
            await prisma.sessionPublisher.create({
              data: {
                publisherId: p.id,
                sessionId: Number(params.id),
              },
            });
            return json({ success: true, publisher: p, update: false });
          }
        }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return a response with the error details
      return json({ success: false, errors: error.errors }, { status: 400 });
    }
    // Handle unexpected errors
    return json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
};

export default function Session() {
  const { conventId } = useParams();
  const { publishers, session } = useLoaderData();
  const fetcher = useFetcher();
  let navigate = useNavigate();

  const { control, setValue, register, getValues, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      publishers,
    },
  });

  const inputValue = watch("publisher.id");

  /**
  useEffect(() => {
    if (Array.isArray(publishers)) {
      setValue("publishers", publishers);
    }
  }, [publishers, setValue]);

  */
  const [options, setOptions] = useState<
    OptionsOrGroups<OptionType, GroupType>
  >([]);
  const [loading, setLoading] = useState(false); // Ny state för att spåra laddningsstatus

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (!fetcher.data.errors && Array.isArray(fetcher.data)) {
        const newOptions = fetcher.data.map((item) => ({
          value: item.id.toString(),
          label: item.name,
          ...item,
        }));
        setOptions(newOptions);

        setLoading(false);
      }

      if (fetcher.data && fetcher.data.publisher) {
        const { publisher, update } = fetcher.data;

        setOptions([
          {
            value: publisher.id.toString(),
            label: publisher.name,
            ...publisher,
          },
        ]);

        toast.info(`${publisher.name} ${update ? " uppdaterad" : " tillagd"}`, {
          className: "md:p-2",
          position: "top-left",
          closeButton: true, // Ändrat till true för att visa stängknappen
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          autoClose: 2000,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        });
      }
    }
  }, [fetcher.data, fetcher.state, loading]);

  const loadOptions = async (inputValue: string) => {
    if (!inputValue.trim()) return [];

    if (fetcher.state !== "loading" && !loading) {
      fetcher.submit(
        JSON.stringify({
          name: inputValue,
          conventId: conventId || "",
        }),
        {
          action: "/api/publishers",
          method: "POST",
          encType: "application/json",
        }
      );
      setLoading(true);
    }

    return new Promise((resolve) => {
      if (!loading) {
        resolve(options);
      }
    });
  };

  const handlePublisherSubmit: MouseEventHandler<HTMLButtonElement> = async (
    event
  ) => {
    event.preventDefault();
    const formData = getValues();
    const publisherId = formData.publisher.id
      ? formData.publisher.id.toString()
      : undefined;
    const publisherData = {
      ...formData.publisher,
      id: publisherId,
    };

    try {
      const result = formSchema.parse({
        action: "publisher",
        publisher: publisherData,
      });

      fetcher.submit(
        { action: "publisher", ...result },
        { encType: "application/json", method: "post" }
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message, {
          className: "md:p-2",
          position: "top-left",
          closeButton: true, // Ändrat till true för att visa stängknappen
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          autoClose: 2000,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        });
      } else {
      }
    }
  };

  const handlePublishersSubmit: MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    event.preventDefault();
    const formData = getValues();
    const { publisher, ...rest } = formData; // Exkludera publisher från formData
    fetcher.submit(
      { action: "publishers", ...rest },
      { encType: "application/json", method: "post" }
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
          <h2 className="text-2xl font-semibold text-gray-800">
            {session.theme}
          </h2>
        </div>
        <form className="grid grid-cols-1 gap-4 mt-8">
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="publishers"
            >
              Förkunnare
            </label>
            <Controller
              name="publishers"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  {...field}
                  isMulti
                  loadOptions={loadOptions}
                  noOptionsMessage={() => "Inga träffar"}
                  placeholder="Sök förkunnare"
                  onChange={(selectedOptions) => {
                    if (!selectedOptions) {
                      field.onChange([]);
                    } else {
                      field.onChange(
                        selectedOptions.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))
                      );
                    }
                  }}
                  value={field.value || []}
                  getOptionLabel={(option) => option.label}
                  getOptionValue={(option) => option.value}
                />
              )}
            />
          </div>

          <div className="flex items-end justify-end">
            <button
              onClick={handlePublishersSubmit}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
            >
              Uppdatera
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="newPublisher"
            >
              {inputValue ? "Ändra" : "Ny"} förkunnare
            </label>
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="publishers"
              >
                Förkunnare
              </label>
              <Controller
                name="publisher"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    {...field}
                    placeholder="Sök förkunnare"
                    isMulti={false}
                    isClearable={true}
                    loadOptions={loadOptions}
                    noOptionsMessage={() => "Inga träffar"}
                    onChange={(option) => {
                      if (!option) {
                        setValue("publisher.name", "");
                        setValue("publisher.congregation", "");
                        setValue("publisher.circuit", "");
                        setValue("publisher.circuitSection", "");
                        setValue("publisher.id", undefined);
                        field.onChange();
                      } else {
                        setValue("publisher.name", option.name);
                        setValue("publisher.congregation", option.congregation);
                        setValue("publisher.circuit", option.circuit);
                        setValue(
                          "publisher.circuitSection",
                          option.circuitSection
                        );
                        setValue("publisher.id", option.id.toString());

                        field.onChange(option);
                      }
                    }}
                    value={
                      field.value && field.name.trim() ? undefined : "manne"
                    }
                    getOptionLabel={(option) => option.label}
                    getOptionValue={(option) => option.value}
                  />
                )}
              />
            </div>
            <input
              type="text"
              {...register("publisher.name")}
              placeholder="Namn"
              className={classNames(
                `shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`
              )}
            />
            <input
              type="text"
              {...register("publisher.congregation")}
              placeholder="Församling"
              className={classNames(
                `shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`
              )}
            />
            <input
              type="text"
              {...register("publisher.circuit")}
              placeholder="Krets"
              className={classNames(
                `shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`
              )}
            />
            <input
              type="text"
              {...register("publisher.circuitSection")}
              placeholder="Kretssektion (valfritt)"
              className={classNames(
                `shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`
              )}
            />
            <input type="hidden" {...register("publisher.id")} />
          </div>

          <div className="flex items-end justify-end mt-4">
            <button
              name="action"
              value="newPublisher"
              onClick={handlePublisherSubmit}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
            >
              {inputValue ? "Uppdatera" : "Lägg till"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
