import { useEffect } from "react";

export default function Signup() {
  useEffect(() => {
    window.location.replace("/#waitlist-form");
  }, []);
  return null;
}
