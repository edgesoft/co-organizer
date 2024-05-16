import {
  redirect,
  type LoaderFunction,
  type MetaFunction,
} from "@remix-run/node";
import { auth } from "../services/fb";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  getIdToken,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router-dom";
import { Bounce, toast } from "react-toastify";
import { verifyUserSession } from "~/services/cookie.server";
import { useLoaderData } from "@remix-run/react";
import { classNames } from "~/utils/classnames";
import { prisma } from "~/services/db.server";
import { getDatesForSchedule } from "~/utils/helpers";

export function Icon() {
  return (
    <svg
      width="100%"
      x="0"
      y="0"
      version="1.1"
      viewBox="0 0 528 522"
      xmlSpace="preserve"
      className="rounded-full w-20 h-20 border border-black inline-block"
    >
      <path
        fill="#1C282F"
        d="M281 523H1.033V1.095h527.809V523H281m-65.085-405.87c3.205-36.706 15.801-69.118 44.457-95.14-5.259.506-9.382.634-13.407 1.332-59.349 10.292-98.269 63.258-87.992 121.488 7.74 43.86 40.806 75.154 85.164 78.803 3.511.29 7.067.038 11.13.038-26.052-21.612-37.596-49.273-38.748-82.298-.166-7.783-.332-15.565-.604-24.224M242.1 261.96c-18.421 14.125-38.845 23.73-61.886 27.43-19.555 3.139-39.183 3.126-58.762.662-36.238-4.56-68.378-18.008-94.25-44.595-.827-.85-1.796-1.563-3.05-2.64 1.123 15.559 4.35 29.915 9.67 43.883 19.7 51.714 66.499 75.677 119.383 59.237 42.92-13.342 71.27-43.725 90.699-83.922l-.215-.77c-.315.166-.63.333-1.59.715m-194.807 223c5.268-.1 10.536-.2 16.682-.597 4.608.066 9.217.132 14.297.82 1.904-.302 3.81-.605 6.59-1.145 17.413-2.697 35.127-4.16 52.181-8.325 49.133-12.002 91.924-35.78 126.727-72.844 26.47-28.19 44.567-61.413 54.908-98.517 5.836-20.94 9.397-42.51 14.217-63.742 5.103-22.476 14.251-43.08 31.044-59.3 22.056-21.302 49.593-30.65 79.458-33.17 16.892-1.424 33.948-.9 50.93-1.247 1.457-.03 2.914-.004 4.37-.004l.053-1.293c-1.707-.556-3.403-1.15-5.124-1.661-21.201-6.307-42.467-12.407-63.559-19.06-4.378-1.381-9.008-4.02-11.989-7.421-14.283-16.3-32.574-22.283-53.333-20.685-28.725 2.212-48.883 18.572-64.05 41.824-13.496 20.69-17.517 44.067-17.51 68.226.012 38.95-12.62 73.86-33.312 106.193-22.267 34.795-51.074 63.399-84 88.145-40.347 30.325-84.018 55.075-128.839 77.965-1.952.997-3.897 2.01-5.845 3.016l.412.846c5.138.418 10.277.835 15.692 1.977m350.57-65.658l-12.309 27.534c16.887-7.01 31.096-17.793 43.227-31.248 26.449-29.336 38.523-63.408 32.16-102.95-5.555-34.512-24.353-60.7-52.625-80.398-12.669-8.826-26.473-15.591-41.177-20.698-.144.777-.326 1.12-.234 1.36 1.549 4.033 3.095 8.068 4.714 12.073 12.35 30.536 24.934 61.01 31.921 93.357 7.314 33.861 7.274 67.412-5.678 100.97m-99.208 70.865c8.613-5.004 17.908-9.127 25.71-15.176 23.78-18.434 38.393-43.147 45.476-72.141 10.262-42.007 4.852-82.644-12.147-122.029-.208-.482-.82-.79-1.493-1.41-1.136 24.268-8.212 46.377-20.284 66.664-15.893 26.707-29.268 54.455-39.682 83.768-7.618 21.444-19.923 40.253-36.553 55.965-5.26 4.97-11.08 9.348-16.76 14.092 13.011 2.44 36.588-1.625 55.733-9.733M79.568 140.093c-13.04 39.908.058 80.963 32.647 103.203 32 21.84 75.245 16.196 97.13 3.082-37.767-9.095-62.12-33.184-75.813-68.267-13.413-34.363-14.133-68.923 2.405-103.035-25.357 15.955-45.609 35.88-56.369 65.017z"
        opacity="1"
      ></path>
      <path
        fill="#FDFDFE"
        d="M77.8 484.56a2877.29 2877.29 0 00-14.66-.182c-5.93-.038-11.028-.09-16.125-.141L31.6 482.984l-.412-.846c1.948-1.006 3.893-2.019 5.845-3.016 44.82-22.89 88.492-47.64 128.84-77.965 32.925-24.746 61.732-53.35 84-88.145 20.691-32.332 33.323-67.243 33.311-106.193-.007-24.16 4.014-47.535 17.51-68.226 15.167-23.252 35.325-39.612 64.05-41.824 20.759-1.598 39.05 4.385 53.333 20.685 2.981 3.402 7.611 6.04 11.99 7.42 21.09 6.654 42.357 12.754 63.558 19.06 1.72.513 3.417 1.106 5.124 1.662l-.052 1.293c-1.457 0-2.914-.025-4.37.004-16.983.347-34.039-.177-50.93 1.248-29.866 2.518-57.403 11.867-79.459 33.17-16.793 16.218-25.941 36.823-31.044 59.3-4.82 21.232-8.381 42.8-14.217 63.741-10.341 37.104-28.438 70.327-54.908 98.517-34.803 37.064-77.594 60.842-126.727 72.844-17.054 4.166-34.768 5.628-53.007 8.372-2.63.19-4.433.333-6.236.476m312.434-352.798c-2.776-10.998-12.87-16.41-21.324-11.433-6.11 3.597-8.903 10.798-6.645 17.132 2.181 6.12 9.079 10.401 15.338 9.521 7.078-.996 12.216-6.812 12.63-15.22z"
        opacity="1"
      ></path>
      <path
        fill="#FDFDFD"
        d="M397.978 418.932c12.835-33.187 12.875-66.738 5.561-100.599-6.987-32.346-19.57-62.821-31.92-93.357-1.62-4.005-3.166-8.04-4.715-12.073-.092-.24.09-.583.234-1.36 14.704 5.107 28.508 11.872 41.177 20.698 28.272 19.698 47.07 45.886 52.624 80.399 6.364 39.54-5.71 73.613-32.16 102.95-12.13 13.454-26.339 24.237-43.226 31.247 4.152-9.288 8.23-18.411 12.425-27.905zM243.653 262.497c-19.177 39.715-47.528 70.098-90.448 83.44-52.884 16.44-99.682-7.523-119.383-59.237-5.32-13.968-8.547-28.324-9.67-43.884 1.254 1.078 2.223 1.79 3.05 2.64 25.872 26.588 58.012 40.037 94.25 44.596 19.58 2.464 39.207 2.477 58.762-.662 23.041-3.7 43.465-13.305 62.426-27.338.698.209.856.327 1.013.445z"
        opacity="1"
      ></path>
      <path
        fill="#FCFDFD"
        d="M216.003 141.999c1.668 32.379 13.212 60.04 39.264 81.652-4.063 0-7.619.251-11.13-.038-44.358-3.65-77.423-34.943-85.164-78.803-10.277-58.23 28.643-111.196 87.992-121.488 4.025-.698 8.148-.826 13.407-1.333-28.656 26.023-41.252 58.435-44.52 95.968.008 8.566.08 16.304.15 24.042z"
        opacity="1"
      ></path>
      <path
        fill="#FDFDFD"
        d="M298.31 490.33c-18.802 7.946-42.379 12.011-55.39 9.57 5.68-4.743 11.5-9.12 16.76-14.091 16.63-15.712 28.935-34.52 36.553-55.965 10.414-29.313 23.79-57.061 39.682-83.768 12.072-20.287 19.148-42.396 20.284-66.664.674.62 1.285.928 1.493 1.41 17 39.385 22.409 80.022 12.147 122.029-7.083 28.994-21.695 53.707-45.475 72.141-7.803 6.049-17.098 10.172-26.054 15.339z"
        opacity="1"
      ></path>
      <path
        fill="#FCFDFD"
        d="M79.704 139.722c10.624-28.767 30.876-48.69 56.233-64.646-16.538 34.112-15.818 68.672-2.405 103.035 13.693 35.083 38.046 59.172 75.814 68.267-21.886 13.114-65.13 18.757-97.13-3.082-32.59-22.24-45.689-63.295-32.512-103.574z"
        opacity="1"
      ></path>
      <path
        fill="#2E373A"
        d="M216.261 141.676c-.33-7.415-.401-15.153-.357-23.28.283 7.392.45 15.174.357 23.28z"
        opacity="1"
      ></path>
      <path
        fill="#0F1B1E"
        d="M47.154 484.599c4.958-.31 10.056-.259 15.548-.073-4.874.234-10.142.335-15.548.073zM78.035 484.872c1.567-.454 3.37-.596 5.562-.668a22.964 22.964 0 01-5.562.668z"
        opacity="1"
      ></path>
      <path
        fill="#FDFDFD"
        d="M242.963 261.944c.097-.366.411-.533.726-.7.072.257.143.514.09 1.012-.283.123-.44.005-.816-.312z"
        opacity="1"
      ></path>
      <path
        fill="#1D272F"
        d="M390.265 132.186c-.447 7.985-5.585 13.801-12.663 14.797-6.259.88-13.157-3.401-15.338-9.52-2.258-6.335.535-13.536 6.645-17.133 8.454-4.977 18.548.435 21.356 11.856z"
        opacity="1"
      ></path>
    </svg>
  );
}

export let meta: MetaFunction = (d) => {
  if (d.data && d.data.convent) {
    const convent = d.data.convent;
    const { startDate, endDate } = convent;
    return [
      {
        title: `${convent.theme}`,
      },
      {
        name: "description",
        content: `Sammankomst - ${convent.theme} (${convent.location} ${
          getDatesForSchedule(startDate).isoDate
        } - ${getDatesForSchedule(endDate).isoDate})`,
      },
      {
        property: "twitter:image",
        content: `${convent.image}`,
      },
      {
        property: "og:image",
        content: `${convent.image}`,
      },
    ];
  }
  return [
    {
      title: `Sammankomster`,
    },
    {
      name: "description",
      content: `Sammankomster`,
    },
    {
      property: "twitter:image",
      content: `/logo2.png`,
    },
    {
      property: "og:image",
      content: `/logo2.png`,
    },
  ];
};
export const loader: LoaderFunction = async ({ request }) => {
  const { user } = await verifyUserSession(request);
  if (user) {
    const userConvents = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        userConvents: {
          select: {
            convent: true,
          },
        },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let events = userConvents?.userConvents.map(userConvent => userConvent.convent) || []
    if (user.role !== 'ADMIN') {
      events = events.filter(event => {
        const endDate = new Date(event.endDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate >= today;
      });
    }
    let url = "/events"
    if (events.length === 1) {
      const convent = events[0]
      if (convent) {
        const { date } = getDatesForSchedule(convent.startDate);
        url = `/schedule/${convent.id}/${date}`
      }
    }

    return redirect(url);
  }

  const url = new URL(request.url);
  const conventId = url.searchParams.get("conventId");
  const convent = conventId
    ? await prisma.convent.findUnique({
        where: { id: parseInt(conventId) || 0 },
      })
    : null;

  return { env: process.env.CO_ENV, convent };
};

const showError = (error: string) => {
  // remove error that is not error
  if (error.toLocaleLowerCase().includes("recaptcha client element")) return;
  toast.error(error, {
    className: "md:p-2",
    position: "top-left",
    closeButton: true,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    autoClose: 2000,
    draggable: true,
    progress: undefined,
    theme: "light",
    transition: Bounce,
  });
};

type LoaderProps = {
  env: string;
};

function isValidPartialNumber(input: string) {
  // Tillåter +46 följt av 7 (Sverige), +47 följt av 4 eller 9 (Norge), eller +45 (Danmark)
  if (input.startsWith("+")) {
    if (input.length === 1) return true; // Tillåter "+"
    if (input.length === 2) return input === "+4";
    if (input.length === 3)
      return input === "+46" || input === "+47" || input === "+45";
    if (input.startsWith("+46") && input.length === 4) return input[3] === "7"; // Efter "+46" måste en "7" följa
    if (input.startsWith("+47") && input.length === 4)
      return input[3] === "4" || input[3] === "9"; // Efter "+47" måste en "4" eller "9" följa
    if (input.startsWith("+467")) return /^(\+467\d{0,8})$/.test(input); // Svenska mobilnummer efter +467
    if (input.startsWith("+474") || input.startsWith("+479"))
      return /^(\+47[49]\d{0,7})$/.test(input); // Norska mobilnummer efter +474 eller +479
    if (input.startsWith("+45")) return /^(\+45\d{0,8})$/.test(input); // Danska mobilnummer efter +45
  } else if (input.startsWith("0")) {
    if (input.length === 1) return true; // Tillåter "0" för svenska nummer
    if (input.length === 2) return input === "07"; // Svenska nationella nummer börjar med "07"
    return /^(07\d{0,8})$/.test(input); // Svenska nationella mobilnummer
  }
  return false; // Om inget matchar
}

export default function Index() {
  const { env } = useLoaderData<LoaderProps>();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const fetcher = useFetcher();
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [appVerifier, setAppVerifier] = useState(null);
  const phoneNumberRegex =
    /^(\+467\d{8}|07\d{8}|\+474\d{7}|\+479\d{7}|\+45\d{8})$/;
  const [revalidate, setRevalidate] = useState(false);
  const [progress, setProgress] = useState({ start: 0, stop: 100 });

  const [SMSProgress, setSMSProgress] = useState({ start: 0, stop: 100 });
  const [firebaseProcess, setFirebaseProcess] = useState(false);

  useEffect(() => {
    const isDone = fetcher.state === "idle" && fetcher.data != null;
    const fetchData = async () => {
      if (isDone) {
        if (env === "development") {
          setTimeout(() => {
            setShowVerificationInput(true);
          }, 3000);
        } else {
          try {
            let verifier = null;
            if (!appVerifier) {
              const av = new RecaptchaVerifier(auth, "recaptcha-container", {
                size: "invisible",
              });
              verifier = av;
              setAppVerifier(av);
            } else {
              verifier = appVerifier;
            }
            let phone = phoneNumber;
            if (!phoneNumber.toString().startsWith("+46")) {
              phone = `+46${phoneNumber.toString().substring(1, 10)}`;
            }

            const confirmationResult = await signInWithPhoneNumber(
              auth,
              phone,
              verifier
            );

            setConfirmationResult(confirmationResult);
            setShowVerificationInput(true);
          } catch (e) {
            setRevalidate(false);
            setFirebaseProcess(false);
            showError(e.message);
          }
        }
      }
    };

    if (isDone && revalidate) {
      if (fetcher.data.error) {
        setRevalidate(false);
        setFirebaseProcess(false);
        showError(fetcher.data.error);
      } else {
        fetchData();
      }
    }
  }, [revalidate, phoneNumber, fetcher, fetcher.state]);

  useEffect(() => {
    let timer: NodeJS.Timeout | number | undefined = undefined;
    let p = 0;
    if (!showVerificationInput && firebaseProcess) {
      timer = setInterval(() => {
        p = p + 2;
        if (p + progress.start < 100)
        setProgress({ start: p, stop: progress.stop });
      }, 100);
    }

    return () => {
      clearInterval(timer);
    };
  }, [firebaseProcess, showVerificationInput]);

  useEffect(() => {
    let timer: NodeJS.Timeout | number | undefined = undefined;
    let p = 0;
    if (SMSProgress.start > 0) {
      timer = setInterval(() => {
        p = p + 2;
        if (p + SMSProgress.start < 100)
          setSMSProgress({ start: p + SMSProgress.start, stop: 100 });
      }, 100);
    }

    return () => {
      clearInterval(timer);
    };
  }, [SMSProgress.start]);

  const isValidPhoneNumber = (phoneNumber: string) => {
    return phoneNumberRegex.test(phoneNumber);
  };

  const handlePhoneNumberChange = (event) => {
    setRevalidate(false);
    setPhoneNumber(event.target.value);
  };

  const handleVerificationCodeChange = (event) => {
    setVerificationCode(event.target.value);
  };

  const isValid = isValidPhoneNumber(phoneNumber);

  const loginWithSMS = async () => {
    setFirebaseProcess(true);
    await fetcher.submit(
      { phoneNumber: phoneNumber },
      { action: "/token", method: "post" }
    );

    setRevalidate(true);
  };

  const handleVerificationSubmit = async () => {
    if (env === "development") {
      setSMSProgress({ start: 1, stop: 100 });
      setTimeout(async () => {
        await fetcher.submit(
          { phoneNumber: phoneNumber, idToken: phoneNumber },
          { action: "/token", method: "post" }
        );
        toast.success(`Loggade in ${phoneNumber}`, {
          className: "md:p-2",
          position: "top-left",
          closeButton: true,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          autoClose: 2000,
          theme: "light",
          transition: Bounce,
        });
      }, 5000);
    } else {
      try {
        setSMSProgress({ start: 1, stop: 100 });
        const credential = await confirmationResult.confirm(verificationCode);
        const user = credential.user;
        const idToken = await getIdToken(user);

        fetcher.submit(
          { phoneNumber: user.phoneNumber, idToken },
          { action: "/token", method: "post" }
        );

        toast.success(`Loggade in ${user.phoneNumber}`, {
          className: "md:p-2",
          position: "top-left",
          closeButton: true,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          autoClose: 2000,
          theme: "light",
          transition: Bounce,
        });
      } catch (error) {
        setSMSProgress({ start: 0, stop: 100 });
        setFirebaseProcess(false);
        setRevalidate(false);
        showError(error.message);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 px-4">
      <header className="w-full bg-slate-900 text-white py-2 px-2 fixed top-0 z-50 border-b border-slate-700">
        <div className="p-1">
          <Icon />
        </div>
      </header>
      <div
        className={`relative p-8 bg-white rounded-lg shadow-xl w-96 border-slate-900`}
      >
        {firebaseProcess && !showVerificationInput ? (
          <div
            className="absolute bg-slate-300 rounded-t-lg"
            style={{ height: 15, width: "calc(100%)", left: 0, top: 0 }}
          >
            <div
              className={`bg-teal-400 rounded-tl-lg ${
                progress.start === 100 ? "rounded-tr-lg" : ""
              }`}
              style={{
                width: `${(progress.start / progress.stop) * 100}%`,
                height: 15,
              }}
            ></div>
          </div>
        ) : null}
        {SMSProgress.start > 0 ? (
          <div
            className="absolute bg-slate-300 rounded-t-lg"
            style={{ height: 15, width: "calc(100%)", left: 0, top: 0 }}
          >
            <div
              className={`bg-teal-400 rounded-tl-lg ${
                SMSProgress.start === 100 ? "rounded-tr-lg" : ""
              }`}
              style={{
                width: `${(SMSProgress.start / SMSProgress.stop) * 100}%`,
                height: 15,
              }}
            ></div>
          </div>
        ) : null}

        <h1 className="text-3xl font-bold text-center text-slate-700 mb-6">
          Logga in
        </h1>
        <fetcher.Form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isValid) {
              return false;
            }
            showVerificationInput ? handleVerificationSubmit() : loginWithSMS();
          }}
        >
          <div className="mb-4">
            {showVerificationInput ? (
              <input
                type="text"
                id="sms"
                placeholder="SMS kod"
                value={verificationCode}
                onChange={handleVerificationCodeChange}
                className="w-full px-3 py-2 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
              />
            ) : (
              <input
                type="tel"
                id="phoneNumber"
                placeholder="Mobiltelefon"
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || isValidPartialNumber(value)) {
                    handlePhoneNumberChange(e);
                  }
                }}
                disabled={revalidate || fetcher.state === "submitting"}
                className={`w-full px-3 py-2 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200`}
              />
            )}
          </div>
          <button
            className={classNames(
              "w-full py-2 px-4 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition duration-200",
              !isValid ? "bg-slate-300" : "bg-slate-700 hover:bg-slate-900",
              fetcher.state === "submitting" ? "bg-slate-300" : "bg-slate-700"
            )}
          >
            Logga in
          </button>
        </fetcher.Form>
      </div>
      <div id="recaptcha-container" className="hidden"></div>
    </div>
  );
}
