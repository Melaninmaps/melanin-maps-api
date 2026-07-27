import { useEffect } from "react";

export default function Signup() {
  useEffect(() => {
    window.location.replace("/waitlist");
  }, []);
  return null;
}
