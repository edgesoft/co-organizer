import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { InputActionMeta } from "react-select";
import { Bounce, toast } from "react-toastify";
import { ConventLoaderType, HeaderProps } from "~/types/types";
import { capitalizeFirstLetter, getDatesForSchedule } from "~/utils/helpers";
import Select from "react-select";

const searchToastId = "search-toast-id";
const menuToastId = "menu-toast-id";

const getDatesInRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateList = [];

  for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
    dateList.push(new Date(date));
  }

  return dateList;
};

const SearchMessage = () => {
  const [index, setIndex] = useState(0);

  const info = [
    "Sök på talarens namn",
    "Sök på temat på talet",
    "T för tal (T01 är disposition 01)",
    "P för övning (P01 är första övningen)",
    "C bocka av talare (C01 är första passet)",
    "O ordföranderummet  (O01 är första passet)",
    "B Bön  (B01 är första bönen)",
    "M Musik  (M01 är första)",
  ];

  return (
    <div className="flex flex-col items-start w-full text-md">
      <span>{info[index]}</span>
      <div className="flex items-center justify-between w-full">
        <button
          className="text-sm mt-2 rounded-md shadow-md bg-blue-900 text-white px-4 py-2 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          onClick={() => {
            setIndex(index === info.length - 1 ? 0 : index + 1);
            toast.update(searchToastId, {
              autoClose: 6000,
              hideProgressBar: false,
              pauseOnFocusLoss: false,
              pauseOnHover: false,
            });
          }}
        >
          Nästa {index + 1} / {info.length}
        </button>
        <button
          className="text-sm mt-2 rounded-md shadow-md bg-blue-900 text-white px-4 py-2 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          onClick={() => {
            toast.dismiss();
          }}
        >
          Stäng
        </button>
      </div>
    </div>
  );
};

const Menu = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-start w-full text-md">
      <p>Menu</p>
      <div className="flex items-center justify-between w-full">
        <button
          className="text-sm mt-2 rounded-md shadow-md bg-blue-900 text-white px-4 py-2 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          onClick={() => {
            toast.dismiss();
            navigate("/logout");
          }}
        >
          Logga ut
        </button>
        <button
          className="text-sm mt-2 rounded-md shadow-md bg-blue-900 text-white px-4 py-2 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          onClick={() => {
            toast.dismiss();
            navigate("/events");
          }}
        >
          Start
        </button>
      </div>
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ onKeyDown }) => {
  const { convent, currentDate } = useLoaderData<ConventLoaderType>();
  const navigate = useNavigate();
  const dates = getDatesInRange(convent.startDate, convent.endDate);
  const weekdays = dates.map((d) => {
    const { isoDate, date } = getDatesForSchedule(d);
    return {
      weekday: capitalizeFirstLetter(
        d.toLocaleDateString("sv-SE", { weekday: "long" })
      ),
      isoDate,
      date,
    };
  });
  return (
    <div
      className="fixed top-0 left-0 w-full border-b border-gray-200 z-50 h-16  backdrop-blur-md flex items-center justify-between pl-1"
      style={{
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div className="relative pr-1 w-full flex">
        <div className="flex-shrink-0 mr-1" style={{ minWidth: "150px" }}>
          <Select
            options={weekdays.map((w) => ({ label: w.weekday, value: w.date }))}
            isMulti={false}
            defaultValue={{ value: currentDate.date, label: capitalizeFirstLetter(
              new Date(currentDate.isoDate).toLocaleDateString("sv-SE", { weekday: "long" })
            )}}
            onChange={(selectedOption) => {
              if (!selectedOption) return null
              navigate(`/schedule/${convent.id}/${selectedOption.value}`);
            }}
            ref={null} // Tillfälligt för att undvika en felmeddelande, använd din egen referens här
            className={`w-full shadow appearance-none border rounded text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-1/4`} // Dynamisk klass för att lägga till en röd ram vid fel
          />
        </div>
        <input
          style={{ maxHeight: 39, minHeight: 39 }}
          type="text"
          name="searchTerm"
          onChange={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onKeyDown(e.target.value);
            return false;
          }}
          className="flex-grow border border-gray-300 rounded py-2 px-4 text-gray-500 placeholder-gray-300 pr-0.5"
          placeholder="filtrera..."
        />
        <div className="absolute right-0 pr-2 inset-y-0 flex items-center">
          <svg
            fill="#1E293B"
            style={{ width: 20, height: 20 }}
            viewBox="0 0 1920 1920"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toast.info(<SearchMessage />, {
                className: "md:p-2",
                position: "top-left",
                closeButton: false,
                icon: false,
                autoClose: 6000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: false,
                draggable: true,
                toastId: searchToastId,
                updateId: searchToastId,
                theme: "light",
                transition: Bounce,
              });
            }}
          >
            <path
              d="M960 1242.342c62.23 0 112.941 50.71 112.941 112.94 0 62.231-50.71 112.942-112.941 112.942-62.23 0-112.941-50.71-112.941-112.941 0-62.23 50.71-112.941 112.941-112.941Zm89.336-892.01c114.862 29.704 208.264 123.106 237.968 237.967 23.378 90.466 10.729 183.304-35.464 261.46-45.515 77.138-121.186 133.947-207.586 156.084-13.779 3.614-27.783 14.795-27.783 31.962v91.595H903.529v-91.595c0-66.183 46.306-124.235 112.716-141.29 57.6-14.795 107.971-52.743 138.353-104.131 30.833-52.292 39.19-114.635 23.378-175.85-19.651-75.67-81.204-137.223-156.875-156.875-70.927-18.183-143.435-3.953-199.341 39.304-55.68 43.143-87.642 108.31-87.642 178.673H621.176c0-105.6 47.888-203.294 131.464-268.01 83.69-64.828 191.774-86.287 296.696-59.294ZM960-.01c-529.355 0-960 430.644-960 960 0 529.355 430.645 960 960 960 529.468 0 960-430.645 960-960 0-529.356-430.532-960-960-960"
              fillRule="evenodd"
            />
          </svg>
          <svg
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toast.info(<Menu />, {
                position: "top-right",
                closeButton: true,
                icon: false,
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                toastId: menuToastId,
                theme: "light",
                transition: Bounce,
              });
            }}
            className="ml-1"
            style={{ width: 20, height: 20 }}
            viewBox="0 0 20 20"
            fill="#1E293B"
          >
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Header;
