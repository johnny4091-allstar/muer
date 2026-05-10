import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminCategoryActions from "./AdminCategoryActions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Categories | Admin" };

export default async function AdminCategoriesPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const categories = await prisma.category.findMany({
    include: { _count: { select: { threads: true } }, parent: { select: { name: true } } },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0]">Categories</h1>
          <p className="text-sm text-[#475569] mt-1">Manage forum categories and subcategories</p>
        </div>
        <AdminCategoryActions mode="create" />
      </div>

      <div className="cyber-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e3a]">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#475569]">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#475569]">Parent</th>
              <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#475569]">Threads</th>
              <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#475569]">Order</th>
              <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#475569]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-[#1e1e3a] last:border-b-0 hover:bg-[#141428] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color ?? "#00d4ff" }}
                    />
                    <div>
                      <div className="font-medium text-[#e2e8f0]">{cat.name}</div>
                      <div className="text-xs text-[#475569]">/categories/{cat.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#94a3b8]">
                  {cat.parent?.name ?? <span className="text-[#475569] italic">Top-level</span>}
                </td>
                <td className="px-4 py-3 text-center text-[#94a3b8]">{cat._count.threads}</td>
                <td className="px-4 py-3 text-center text-[#94a3b8]">{cat.sortOrder}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <AdminCategoryActions mode="edit" category={cat} />
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#475569]">
                  No categories yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
