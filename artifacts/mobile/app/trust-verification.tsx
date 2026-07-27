import { Redirect } from "expo-router";

export default function TrustVerificationRedirect() {
  return <Redirect href={"/community-verified" as never} />;
}
