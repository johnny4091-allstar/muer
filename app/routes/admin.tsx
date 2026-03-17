import {
  ActionArgs,
  LoaderArgs,
  json,
  redirect,
  createCookieSessionStorage,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";
import { execSync } from "child_process";
import { useEffect, useRef, useState } from "react";

// ─── Admin session ────────────────────────────────────────────────────────────

const adminStorage = createCookieSessionStorage({
  cookie: {
    name: "__admin",
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET ?? "fallback-secret"],
    secure: process.env.NODE_ENV === "production",
  },
});

async function getAdminSession(request: Request) {
  return adminStorage.getSession(request.headers.get("Cookie"));
}

function isAuthenticated(session: any): boolean {
  return session.get("admin") === true;
}

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function loader({ request }: LoaderArgs) {
  const session = await getAdminSession(request);

  if (!isAuthenticated(session)) {
    return json({ authenticated: false, commitHash: "", commitMsg: "", nodeVersion: "", uptime: 0 });
  }

  let commitHash = "unknown";
  let commitMsg = "unknown";
  try {
    commitHash = execSync("git rev-parse --short HEAD", { cwd: process.cwd() })
      .toString()
      .trim();
    commitMsg = execSync("git log -1 --format=%s", { cwd: process.cwd() })
      .toString()
      .trim();
  } catch {
    // git not available or not a repo
  }

  return json({
    authenticated: true,
    commitHash,
    commitMsg,
    nodeVersion: process.version,
    uptime: Math.floor(process.uptime()),
  });
}

// ─── Action ───────────────────────────────────────────────────────────────────

export async function action({ request }: ActionArgs) {
  const session = await getAdminSession(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  // ── Login ──
  if (intent === "login") {
    const password = String(formData.get("password") ?? "");
    if (password && password === process.env.ADMIN_PASSWORD) {
      session.set("admin", true);
      return redirect("/admin", {
        headers: { "Set-Cookie": await adminStorage.commitSession(session) },
      });
    }
    return json({ error: "Invalid password" }, { status: 401 });
  }

  // All other intents require authentication
  if (!isAuthenticated(session)) {
    return json({ error: "Unauthorized" }, { status: 403 });
  }

  // ── Logout ──
  if (intent === "logout") {
    return redirect("/", {
      headers: { "Set-Cookie": await adminStorage.destroySession(session) },
    });
  }

  // ── Trigger update ──
  if (intent === "update") {
    const { writeFileSync } = await import("fs");
    const { spawn } = await import("child_process");

    const STATUS_FILE = "/tmp/muer-update.json";

    const log: string[] = [];
    const writeStatus = (status: string) => {
      try {
        writeFileSync(STATUS_FILE, JSON.stringify({ status, log }));
      } catch {
        // ignore fs errors
      }
    };

    writeStatus("running");

    // Run: git pull → build → pm2 restart — all in background
    const child = spawn(
      "bash",
      [
        "-c",
        [
          `cd ${process.cwd()}`,
          "git pull 2>&1",
          "npm run build:selfhost 2>&1",
          "pm2 restart muer 2>&1 || true",
        ].join(" && "),
      ],
      { detached: true, stdio: ["ignore", "pipe", "pipe"] }
    );

    child.stdout?.on("data", (d: Buffer) => {
      log.push(d.toString());
      writeStatus("running");
    });
    child.stderr?.on("data", (d: Buffer) => {
      log.push(d.toString());
      writeStatus("running");
    });
    child.on("exit", (code: number | null) => {
      writeStatus(code === 0 ? "done" : "error");
    });
    child.unref();

    return json({ started: true });
  }

  return json({ error: "Unknown intent" }, { status: 400 });
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string }>();
  const updateFetcher = useFetcher<{ started?: boolean; error?: string }>();

  const [updateLog, setUpdateLog] = useState<string[]>([]);
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "running" | "done" | "error"
  >("idle");
  const pollingRef = useRef<ReturnType<typeof setTimeout>>();
  const logBoxRef = useRef<HTMLPreElement>(null);

  // Start polling once the update has been triggered
  useEffect(() => {
    if (updateFetcher.data?.started) {
      setUpdateStatus("running");
      setUpdateLog(["Starting update…\n"]);
      schedulePoll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateFetcher.data]);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [updateLog]);

  function schedulePoll() {
    pollingRef.current = setTimeout(doPoll, 1500);
  }

  async function doPoll() {
    try {
      const resp = await fetch("/admin/update-status");
      if (!resp.ok) {
        // Server might be restarting
        setUpdateLog((l) => [...l, "Waiting for server to respond…\n"]);
        pollingRef.current = setTimeout(doPoll, 3000);
        return;
      }
      const result = await resp.json();
      setUpdateLog(result.log ?? []);
      if (result.status === "running") {
        pollingRef.current = setTimeout(doPoll, 1500);
      } else if (result.status === "done") {
        setUpdateStatus("done");
        setUpdateLog((l) => [...l, "\n✓ Update complete! Server restarted.\n"]);
      } else {
        setUpdateStatus("error");
        setUpdateLog((l) => [...l, "\n✗ Update failed. Check the log above.\n"]);
      }
    } catch {
      // Connection refused → server is restarting
      setUpdateLog((l) => [
        ...l,
        "Server is restarting, waiting…\n",
      ]);
      pollingRef.current = setTimeout(doPoll, 3000);
    }
  }

  // ── Login screen ────────────────────────────────────────────────────────────
  if (!data.authenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-neutral-900 rounded-2xl p-8 w-80 shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-white text-xl font-bold">Admin Panel</h1>
          </div>

          <Form method="post">
            <input type="hidden" name="intent" value="login" />
            {actionData?.error && (
              <p className="text-red-400 text-sm mb-3 bg-red-400/10 rounded-lg px-3 py-2">
                {actionData.error}
              </p>
            )}
            <input
              type="password"
              name="password"
              placeholder="Password"
              autoFocus
              className="w-full bg-neutral-800 text-white rounded-lg px-4 py-2.5 mb-4
                         border border-neutral-700 focus:outline-none focus:border-green-500
                         placeholder-neutral-500 text-sm"
            />
            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold
                         rounded-full py-2.5 transition-colors text-sm"
            >
              Sign in
            </button>
          </Form>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  const isUpdating = updateStatus === "running";

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-none">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>

          <Form method="post">
            <input type="hidden" name="intent" value="logout" />
            <button
              type="submit"
              className="text-neutral-400 hover:text-white text-sm transition-colors"
            >
              Sign out
            </button>
          </Form>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-neutral-900 rounded-xl p-4">
            <p className="text-neutral-500 text-xs mb-1 uppercase tracking-wide">Commit</p>
            <p className="text-white font-mono text-sm font-semibold">{data.commitHash}</p>
            <p className="text-neutral-400 text-xs mt-1 line-clamp-2">{data.commitMsg}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl p-4">
            <p className="text-neutral-500 text-xs mb-1 uppercase tracking-wide">Node.js</p>
            <p className="text-white font-mono text-sm font-semibold">{data.nodeVersion}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl p-4 col-span-2 sm:col-span-1">
            <p className="text-neutral-500 text-xs mb-1 uppercase tracking-wide">Uptime</p>
            <p className="text-white font-mono text-sm font-semibold">
              {formatUptime(data.uptime)}
            </p>
          </div>
        </div>

        {/* Deploy card */}
        <div className="bg-neutral-900 rounded-2xl p-6">
          <h2 className="text-white font-semibold text-lg mb-1">Deploy Update</h2>
          <p className="text-neutral-400 text-sm mb-5">
            Pulls the latest code from Git, rebuilds the app, and restarts the
            server automatically. All users will see the update within seconds.
          </p>

          <updateFetcher.Form method="post">
            <input type="hidden" name="intent" value="update" />
            <button
              type="submit"
              disabled={isUpdating}
              className={`
                inline-flex items-center space-x-2 font-semibold rounded-full px-6 py-2.5 text-sm
                transition-all
                ${
                  isUpdating
                    ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                    : updateStatus === "done"
                    ? "bg-green-500 hover:bg-green-400 text-black"
                    : updateStatus === "error"
                    ? "bg-red-600 hover:bg-red-500 text-white"
                    : "bg-green-500 hover:bg-green-400 text-black"
                }
              `}
            >
              {isUpdating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Updating…</span>
                </>
              ) : updateStatus === "done" ? (
                <span>✓ Updated — Deploy Again</span>
              ) : updateStatus === "error" ? (
                <span>✗ Failed — Retry</span>
              ) : (
                <span>Deploy Update</span>
              )}
            </button>
          </updateFetcher.Form>

          {/* Live log */}
          {updateLog.length > 0 && (
            <div className="mt-5">
              <p className="text-neutral-500 text-xs mb-2 uppercase tracking-wide">
                Deployment Log
              </p>
              <pre
                ref={logBoxRef}
                className="bg-black rounded-xl p-4 text-green-400 text-xs font-mono
                           overflow-auto max-h-72 whitespace-pre-wrap border border-neutral-800"
              >
                {updateLog.join("")}
              </pre>
            </div>
          )}

          {updateFetcher.data?.error && (
            <p className="mt-3 text-red-400 text-sm">{updateFetcher.data.error}</p>
          )}
        </div>

        {/* Back link */}
        <p className="mt-6 text-center">
          <a href="/" className="text-neutral-500 hover:text-white text-sm transition-colors">
            ← Back to app
          </a>
        </p>
      </div>
    </div>
  );
}
