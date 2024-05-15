import { useEffect } from "react";

export const useClickOutside = (
    ref: React.MutableRefObject<null>,
    callback: { (): void; (): void }
  ) => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        callback();
      }
    };
    useEffect(() => {
      document.addEventListener("click", handleClick);
      return () => {
        document.removeEventListener("click", handleClick);
      };
    });
  };