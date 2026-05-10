"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil } from "lucide-react";
import type { Category } from "@prisma/client";

type Props =
  | { mode: "create" }
  | { mode: "edit"; category: Category & { parent?: { name: string } | null } };

export default function AdminCategoryActions(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = props.mode === "edit";
  const cat = isEdit ? props.category : null;

  const [name, setName] = useState(cat?.name ?? "");
  const [slug, setSlug] = useState(cat?.slug ?? "");
  const [description, setDescription] = useState(cat?.description ?? "");
  const [color, setColor] = useState(cat?.color ?? "#00d4ff");
  const [sortOrder, setSortOrder] = useState(cat?.sortOrder?.toString() ?? "0");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = isEdit ? `/api/admin/categories/${cat!.id}` : "/api/admin/categories";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description, color, sortOrder: parseInt(sortOrder) }),
      });
      const data = await res.json();
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(data.error ?? "Failed to save category.");
      }
    } catch {
      setError("Network error.");
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          isEdit
            ? "text-xs px-2 py-1 rounded bg-[#141428] border border-[#1e1e3a] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#2d2d5a] transition-colors flex items-center gap-1"
            : "btn-neon-blue px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
        }
      >
        {isEdit ? <Pencil className="w-3 h-3" /> : <Plus className="w-4 h-4" />}
        {isEdit ? "Edit" : "New Category"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative cyber-card p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-[#e2e8f0] mb-4">
              {isEdit ? "Edit Category" : "New Category"}
            </h2>
            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/20 border border-red-800/40 text-sm text-red-400">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 cyber-input text-sm rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Slug</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  className="w-full px-3 py-2 cyber-input text-sm rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 cyber-input text-sm rounded-lg resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="flex-1 px-2 py-1.5 cyber-input text-xs rounded-lg font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 cyber-input text-sm rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 btn-neon-blue rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isEdit ? "Save Changes" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] bg-[#141428] border border-[#1e1e3a] hover:text-[#e2e8f0] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
