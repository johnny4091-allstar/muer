/** @type {import('pm2').StartOptions} */
require("dotenv").config();

module.exports = {
  apps: [
    {
      name: "muer",
      script: "node_modules/.bin/remix-serve",
      args: "build",
      cwd: __dirname,
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        ...process.env,
      },
      // Restart automatically if it crashes
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      // Keep logs tidy
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
