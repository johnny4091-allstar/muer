import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import AdminUserActions from "./AdminUserActions";

export const metadata = { title: "Users | Admin | StreamZone" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { profile: { select: { reputation: true, postCount: true } } },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-[#e2e8f0]">User Management</h1>

      <div className="cyber-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e3a] text-xs uppercase tracking-wider text-[#475569]">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Posts</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[#1e1e3a] last:border-b-0 hover:bg-[#141428] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center text-xs font-bold text-white">
                        {user.username[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-[#e2e8f0]">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#94a3b8]">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge-neon text-xs ${user.role === "ADMIN" ? "badge-purple" : user.role === "MODERATOR" ? "badge-yellow" : "badge-blue"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.isBanned ? (
                      <span className="badge-neon badge-red text-xs">Banned</span>
                    ) : !user.emailVerified ? (
                      <span className="badge-neon badge-yellow text-xs">Unverified</span>
                    ) : (
                      <span className="badge-neon badge-green text-xs">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#94a3b8]">{user.profile?.postCount ?? 0}</td>
                  <td className="px-4 py-3 text-[#94a3b8]">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <AdminUserActions userId={user.id} isBanned={user.isBanned} role={user.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
