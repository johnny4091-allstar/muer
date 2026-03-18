/** @type {import('@remix-run/dev').AppConfig} */
const isNetlify = process.env.NETLIFY || process.env.NETLIFY_LOCAL;

module.exports = {
  serverBuildTarget: isNetlify ? "netlify" : undefined,
  server: isNetlify ? "./server.js" : undefined,
  serverBuildPath: isNetlify ? undefined : "build/index.js",
  ignoredRouteFiles: ["**/.*"],
};
