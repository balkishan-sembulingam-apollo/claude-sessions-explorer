import type { Route } from "./+types/well-known.chrome-devtools";

export async function clientLoader(_args: Route.ClientLoaderArgs) {
  return null;
}

export default function ChromeDevtoolsProbe() {
  return null;
}
