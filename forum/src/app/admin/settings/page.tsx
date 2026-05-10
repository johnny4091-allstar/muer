import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSettingsForm from "./AdminSettingsForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Site Settings | Admin" };

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const settings = await prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0]">Site Settings</h1>
        <p className="text-sm text-[#475569] mt-1">Configure global forum settings</p>
      </div>
      <AdminSettingsForm settings={settingsMap} />
    </div>
  );
}
