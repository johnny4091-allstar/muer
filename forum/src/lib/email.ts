import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM ?? "StreamZone <noreply@streamzone.local>";
const SITE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const SITE_NAME = "StreamZone";

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${SITE_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Verify your ${SITE_NAME} account`,
    html: emailTemplate("Verify Your Email", `
      <p>Welcome to <strong>${SITE_NAME}</strong>! Click the button below to verify your email address.</p>
      <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#a855f7);color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">Verify Email</a>
      <p style="color:#94a3b8;font-size:13px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
    `),
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${SITE_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Reset your ${SITE_NAME} password`,
    html: emailTemplate("Password Reset", `
      <p>Someone requested a password reset for your ${SITE_NAME} account. Click the button below to set a new password.</p>
      <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#a855f7);color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">Reset Password</a>
      <p style="color:#94a3b8;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `),
  });
}

function emailTemplate(title: string, content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0a0f;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;margin:0;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#0f0f1a;border:1px solid #1e1e3a;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,rgba(0,212,255,0.1),rgba(168,85,247,0.1));padding:24px;border-bottom:1px solid #1e1e3a;">
      <h1 style="margin:0;font-size:22px;background:linear-gradient(135deg,#00d4ff,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">⚡ ${SITE_NAME}</h1>
    </div>
    <div style="padding:28px;">
      <h2 style="color:#e2e8f0;margin:0 0 16px;font-size:18px;">${title}</h2>
      ${content}
    </div>
    <div style="padding:16px 28px;border-top:1px solid #1e1e3a;">
      <p style="color:#475569;font-size:12px;margin:0;">© ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}
