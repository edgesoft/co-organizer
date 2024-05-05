import { SessionType, StepType } from "@prisma/client";
import {
  ActionFunction,
  LoaderFunction,
  json,
  redirect,
} from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import Select from "react-select";
import { prisma } from "~/services/db.server";
import { capitalizeFirstLetter } from "~/utils/helpers";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { classNames } from "~/utils/classnames";
import AsyncSelect from "react-select/async";
import type { OptionsOrGroups } from "react-select";

interface OptionType {
  value: string;
  label: string;
}

interface GroupType {
  label: string;
  options: OptionType[];
}

const formSchema = z.object({
  identifier: z
  .custom((value) => {
    if (/^\d{2}$/.test(value)) {
      const num = parseInt(value, 10);
      return num >= 1 && num <= 99;
    } else if (/^[a-zA-Z]{3}$/.test(value)) {
      return true;
    } else {
      return false;
    }
  },
      {
        message: "Identifier must be between 01 and 99",
      }
    ),
  groups: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .optional(),
  theme: z.string().min(1).max(255),
  day: z.string().min(1),
  sessionType: z.string().min(1),
  stepTypes: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .optional(),
  startTime: z.string().refine((value) => /^[0-9]{2}:[0-9]{2}$/.test(value), {
    message: "Starttiden måste vara i formatet hh:mm",
  }),
  stopTime: z.string().refine((value) => /^[0-9]{2}:[0-9]{2}$/.test(value), {
    message: "Stoptiden måste vara i formatet hh:mm",
  }),
});

type FormData = z.infer<typeof formSchema>;

const sessionTypeOptions = [
  { value: SessionType.TALK, label: "Tal" },
  { value: SessionType.CHAIR_MAN_ROOM, label: "Ordförande rummet" },
  { value: SessionType.CHECKING_SPEAKERS, label: "Bocka av talare" },
  { value: SessionType.MUSIC, label: "Musik" },
  { value: SessionType.PRAYER, label: "Bön" },
  { value: SessionType.CHAIR_MAN, label: "Sessionsordförande" },
  { value: SessionType.PODIUM_PRACTICE, label: "Podieövning" },
  { value: SessionType.VIDEO, label: "Video" },
  { value: SessionType.SKE, label: "SKE" },
];

const stepTypeOptions = [
  { value: StepType.RECEIVED_ASSIGNMENT, label: "Talaruppdraget godkänt" },
  { value: StepType.PRACTICE_DONE, label: "Övning gjord" },
  { value: StepType.PODIUM_PRACTICE_DONE, label: "Podieövning gjord" },
  { value: StepType.REGISTERED_ON_FIRST_DAY, label: "Anmäld första dagen" },
  { value: StepType.REGISTERED_ON_SPEAKING_DAY, label: "Anmäld dagen för tal" },
  {
    value: StepType.REGISTERED_30_MINUTES_BEFORE_SPEAKING,
    label: "Anmäld 30 min innan tal",
  },
];

interface Option {
  value: string;
  label: string;
}

const getDatesInRange = (startDate: Date, endDate: Date) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateList = [];

  for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
    dateList.push(new Date(date));
  }

  return dateList;
};

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

  const days = getDatesInRange(convent.startDate, convent.endDate);
  const scheduleDate = params.scheduleDate || "";
  const year = scheduleDate.slice(0, 4);
  const month = scheduleDate ? parseInt(scheduleDate.slice(4, 6)) - 1 : 0; // Om scheduleDate är tomt, använd 0 som standardmånad
  const day = scheduleDate.slice(6, 8);

  const dateObject = new Date(Number(year), Number(month), Number(day));

  return json({
    days: days.map((d) => {
      const isoDate: string = d.toISOString().split("T")[0];
      const formattedDateString: string = isoDate.replace(/-/g, "");

      return {
        value: formattedDateString,
        label: capitalizeFirstLetter(
          d.toLocaleDateString("sv-SE", { weekday: "long" })
        ),
      };
    }),
    selectedDay: {
      value: params.scheduleDate,
      label: capitalizeFirstLetter(
        dateObject.toLocaleDateString("sv-SE", { weekday: "long" })
      ),
    },
  });
};

interface LoaderData {
  days: { value: string; label: string }[];
  selectedDay: { value: string; label: string };
}

export let action: ActionFunction = async ({ request, params }) => {
  const data = await request.json();

  function getTimeComponents(timeStr: string) {
    const parts = timeStr.split(":");
    return {
      hour: parseInt(parts[0], 10), // Konvertera strängen till ett heltal
      minutes: parseInt(parts[1], 10),
    };
  }

  try {
    const result = formSchema.parse(data);

    const year = result.day.slice(0, 4);
    const month = result.day ? parseInt(result.day.slice(4, 6)) - 1 : 0; // Om scheduleDate är tomt, använd 0 som standardmånad
    const day = result.day.slice(6, 8);
    const dateObject = new Date(Number(year), Number(month), Number(day));

    const start = getTimeComponents(result.startTime);
    const stop = getTimeComponents(result.stopTime);

    const getPrefix = (sessionType: SessionType) => {
      switch (sessionType) {
        case SessionType.CHAIR_MAN:
          return "S";
        case SessionType.CHAIR_MAN_ROOM:
          return "O";
        case SessionType.CHECKING_SPEAKERS:
          return "C";
        case SessionType.MUSIC:
          return "M";
        case SessionType.PRAYER:
          return "B";
        case SessionType.TALK:
          return "T";
        case SessionType.VIDEO:
          return "V";
        case SessionType.PODIUM_PRACTICE:
          return "P";
        case SessionType.SKE:
          return ""
      }
    };

    const sessionType =
      SessionType[result.sessionType as keyof typeof SessionType];

    let groupSessionId = null;
    if (sessionType === SessionType.PODIUM_PRACTICE) {
      const group = await prisma.groupSession.create({
        data: {
          date: dateObject,
          startMinutes: start.minutes,
          startHour: start.hour,
          stopMinutes: stop.minutes,
          stopHour: stop.hour,
        },
      });

      groupSessionId = group.id;
    }

    const session = await prisma.session.create({
      data: {
        identifier: `${getPrefix(sessionType)}${result.identifier}`,
        theme: result.theme,
        date: dateObject,
        type: sessionType,
        conventId: Number(params.conventId),
        startMinutes: start.minutes,
        startHour: start.hour,
        stopMinutes: stop.minutes,
        stopHour: stop.hour,
        groupSessionId,
      },
    });

    if (groupSessionId && result.groups) {
      for (const g of result.groups) {
        // Uppdatera sessionen med det nya groupID:et
        await prisma.session.update({
          where: { id: Number(g.value) }, // Använd value som sessionens id
          data: { groupSessionId }, // Uppdatera groupID
        });
      }
    }

    if (result.stepTypes) {
      const stepTypesData = result.stepTypes.map((type) => ({
        stepType: StepType[type.value as keyof typeof StepType],
        sessionId: session.id,
        isCompleted: false,
      }));

      await prisma.sessionStep.createMany({
        data: stepTypesData,
      });
    }

    return redirect(`/schedule/${params.conventId}/${params.scheduleDate}`);
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

const useGroup = (option: Option | null) => {
  const fetcher = useFetcher();
  const { conventId } = useParams();
  const [options, setOptions] = useState<OptionsOrGroups<
    OptionType,
    GroupType
  > | null>(null);
  const [hasFetched, setHasFetched] = useState(false); // State för att spåra om fetch har hänt eller inte

  useEffect(() => {
    if (option && option.value === SessionType.PODIUM_PRACTICE && !hasFetched) {
      // Kör bara om option och om hasFetched är false
      if (fetcher.state !== "loading") {
        fetcher.submit(
          JSON.stringify({
            conventId: conventId || "",
          }),
          {
            action: "/api/groups",
            method: "POST",
            encType: "application/json",
          }
        );
        setHasFetched(true); // Uppdatera hasFetched efter att hämtningen har skett
      }
    }
  }, [option, fetcher, conventId, hasFetched]); // Beroenden: option, fetcher, conventId och hasFetched

  useEffect(() => {
    if (fetcher.data && !fetcher.data.errors) {
      const newOptions = fetcher.data.map((item) => ({
        value: item.id.toString(),
        label: item.theme,
      }));
      setOptions(newOptions);
    }
  }, [fetcher.data]); // Kör när fetcher.data ändras

  return options;
};

export default function Session() {
  const { days, selectedDay }: LoaderData = useLoaderData();
  const fetcher = useFetcher();
  let navigate = useNavigate();

  const [selectedDayOption, setSelectedDayOption] = useState<Option | null>(
    selectedDay ? { value: selectedDay.value, label: selectedDay.label } : null
  );

  const [selectedTypeOption, setSelectedTypeOption] = useState<Option | null>(
    null
  );

  const [selectedStepTypeOptions, setSelectedStepTypeOptions] = useState<
    Option[] | null
  >();

  const stepTypesRef = useRef(null);
  let groupData = useGroup(selectedTypeOption);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
    control,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      day: selectedDayOption?.value || "",
    },
  });

  useEffect(() => {

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow =  'hidden';

    // Städa upp
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleTypeChange = (selectedOption: Option | null) => {
    setSelectedTypeOption(selectedOption);

    if (
      selectedOption &&
      (selectedOption.value === SessionType.MUSIC ||
        selectedOption.value === SessionType.VIDEO ||
        selectedOption.value == SessionType.PODIUM_PRACTICE ||
        selectedOption.value == SessionType.CHECKING_SPEAKERS ||
        selectedOption.value == SessionType.CHAIR_MAN_ROOM)
    ) {
      //setSelectedStepTypeOptions([]);
      stepTypesRef.current.clearValue();
    }


    if (
      selectedOption &&
      (selectedOption.value === SessionType.PRAYER ||
        selectedOption.value === SessionType.CHAIR_MAN)
    ) {
      //setSelectedStepTypeOptions(
      //  stepTypeOptions.filter((f) => f.value !== StepType.PRACTICE_DONE)
      //);
      stepTypesRef.current.clearValue();
      stepTypesRef.current.setValue(
        stepTypeOptions.filter((f) => f.value !== StepType.PRACTICE_DONE)
      );
    }
    if (selectedOption && selectedOption.value === SessionType.TALK) {
      // setSelectedStepTypeOptions(stepTypeOptions);
      stepTypesRef.current.clearValue();
      stepTypesRef.current.setValue(stepTypeOptions);
    }
  };

  const handleStepTypeChange = (selectedOption: Option[] | null) => {
    setSelectedStepTypeOptions(selectedOption);
  };

  const handleDayChange = (selectedOption: Option | null) => {
    setSelectedDayOption(selectedOption);
  };
  const onSubmit = (data: FormData) => {
    console.log(data);

    fetcher.submit(
      { action: "save", ...data },
      { encType: "application/json", method: "post" }
    );
  };


  const disableStepTypes = () => {
    if (
      selectedTypeOption &&
      (selectedTypeOption.value === SessionType.MUSIC ||
        selectedTypeOption.value === SessionType.VIDEO ||
        selectedTypeOption.value == SessionType.PODIUM_PRACTICE ||
        selectedTypeOption.value == SessionType.CHAIR_MAN_ROOM ||
        selectedTypeOption.value == SessionType.CHECKING_SPEAKERS)
    ) {
      return true;
    }

    return false;
  };


  return (
    <div
      className="backdrop-blur-sm fixed inset-0 bg-opacity-50 z-50 flex justify-center items-center "
      style={{
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div className="w-full max-w-lg p-5 bg-white rounded-lg shadow-xl  mt-20 mb-20  relative overflow-y-auto" style={{ maxHeight: '90vh' }}>
      <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className={classNames(
              "absolute right-2 top-2 mr-1 text-2xl font-normal leading-none bg-transparent outline-none focus:outline-none"
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
        <div className="mb-4 border-b pb-2 ">
          <h2 className="text-2xl font-semibold text-gray-800">
            Lägg till händelse
          </h2>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-4 mt-8 flex-1" 
     
        >
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="identifier"
            >
              Identifier *
            </label>
            <input
              {...register("identifier", { required: true })}
              className={classNames(
                `shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`,
                errors.identifier
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500 outline outline-red-500"
                  : ""
              )}
              id="identifier"
              name="identifier"
              type="text"
              placeholder="Identifier"
            />
          </div>
          

          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="sessionType"
            >
              Typ *
            </label>
            <Controller
              name="sessionType"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={sessionTypeOptions}
                  placeholder={"Välj typ"}
                  isMulti={false}
                  onChange={(selectedOption: Option | null) => {
                    field.onChange(selectedOption?.value);
                    handleTypeChange(selectedOption);
                  }}
                  value={selectedTypeOption} // Använda det uppdaterade värdet här
                  // Markera alla andra props som valfria med Partial
                  ref={null} // Tillfälligt för att undvika en felmeddelande, använd din egen referens här
                  name={"sessionType"}
                  id={"sessionType"}
                  className={`shadow appearance-none border rounded w-full  text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                    isSubmitted && errors.sessionType
                      ? "border-red-500"
                      : "border-gray-300"
                  }`} // Dynamisk klass för att lägga till en röd ram vid fel
                />
              )}
            />
          </div>
          {selectedTypeOption &&
          selectedTypeOption.value === SessionType.PODIUM_PRACTICE ? (
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="stepTypes"
              >
                Tal för övning
              </label>
              <Controller
                name="groups"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={groupData ? groupData : []}
                    isMulti={true}
                    classNamePrefix="select"
                    className="shadow"
                    placeholder="Välj tal"
                    id="groups"
                    isDisabled={false}
                  />
                )}
              />
            </div>
          ) : null}
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="stepTypes"
            >
              Anmälningar
            </label>
            <Controller
              name="stepTypes"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  ref={stepTypesRef}
                  options={stepTypeOptions}
                  isMulti={true}
                  classNamePrefix="select"
                  className="shadow"
                  placeholder="Välj anmälningar"
                  id="stepTypes"
                  value={selectedStepTypeOptions}
                  isDisabled={disableStepTypes()}
                  onChange={(newValue) => {
                    const valueToSend = Array.isArray(newValue)
                      ? newValue
                      : newValue
                      ? [newValue]
                      : null;
                    field.onChange(valueToSend);
                    handleStepTypeChange(valueToSend);
                  }}
                />
              )}
            />
          </div>
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="theme"
            >
              Tema *
            </label>
            <input
              {...register("theme", { required: true })}
              className={classNames(
                `shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`,
                errors.theme
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500 outline outline-red-500"
                  : ""
              )}
              id="theme"
              name="theme"
              type="text"
              placeholder="Tema"
            />
          </div>
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="day"
            >
              Dag *
            </label>
            <Controller
              name="day"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={days}
                  required={true}
                  id="day"
                  placeholder={"Välj dag"}
                  isMulti={false}
                  onChange={(selectedOption: Option | null) => {
                    field.onChange(selectedOption?.value);
                    handleDayChange(selectedOption);
                  }}
                  value={selectedDayOption} 
                  ref={null}
                  classNames={{
                    control: (state) => "shadow",
                  }}
                />
              )}
            />
          </div>
          <div className="flex w-full">
            <div className="pr-2 w-1/2">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="startTime"
              >
                Starttid *
              </label>
              <input
                {...register("startTime", { required: true })}
                className={classNames(
                  `shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`,
                  errors.startTime
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500 outline outline-red-500"
                    : ""
                )}
                id="startTime"
                name="startTime"
                type="text"
                placeholder="HH:mm"
              />
            </div>
            <div className="  w-1/2">
              {" "}
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="startTime"
              >
                Stopptid *
              </label>
              <input
                {...register("stopTime", { required: true })}
                className={classNames(
                  `shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`,
                  errors.stopTime
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500 outline outline-red-500"
                    : ""
                )}
                id="stopTime"
                name="stopTime"
                type="text"
                placeholder="HH:mm"
              />
            </div>
          </div>

          <div className="flex items-end justify-end">
            
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Spara
            </button>
            
          </div>
        </form>
      </div>
    </div>
  );
}
