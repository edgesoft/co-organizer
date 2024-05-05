import { useFetcher } from "@remix-run/react";
import { auth} from "../services/fb";
import {  getIdToken } from "firebase/auth";
import { useEffect, useRef } from "react";

export const useAuthRevalidation = (env: string) => {
  const fetcher = useFetcher();
  const hasRevalidated = useRef(false); // Use a ref to track execution
  if (env === "development") {
    useEffect(() => {
      const revalidate = async () => {
        if (!hasRevalidated.current) { // Check the ref before proceeding
          fetcher.submit({ idToken: null, env }, { action: "/actions/revalidateToken", method: "post" });
          hasRevalidated.current = true; // Set ref to true after successful revalidation
        }
      };
  
      revalidate();
    }, []); // Only include 'auth' in the dependency array
  } else {
    const user = auth.currentUser;
    const fetcher = useFetcher();
    const hasRevalidated = useRef(false); // Use a ref to track execution
  
    useEffect(() => {
      const revalidate = async () => {
        if (!hasRevalidated.current && user) { // Check the ref before proceeding
          const idToken = await getIdToken(user);
          console.log("token", user.uid);
          await fetcher.submit({ idToken }, { action: "/actions/revalidateToken", method: "post" });
          hasRevalidated.current = true; // Set ref to true after successful revalidation
        }
      };
  
      revalidate();
    }, [auth]); // Only include 'auth' in the dependency array
  }
  };
  
