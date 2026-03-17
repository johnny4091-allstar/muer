import { LoaderArgs, json } from "@remix-run/node";
import { readFileSync } from "fs";

const STATUS_FILE = "/tmp/muer-update.json";

/** Polled by the admin panel to get live update progress. */
export async function loader({ request }: LoaderArgs) {
  try {
    const raw = readFileSync(STATUS_FILE, "utf-8");
    return json(JSON.parse(raw));
  } catch {
    return json({ status: "idle", log: [] });
  }
}
