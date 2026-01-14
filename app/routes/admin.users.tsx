import { json, LoaderArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";

export async function loader({ request }: LoaderArgs) {
  // TODO: Fetch real data from database
  const users = [
    {
      id: 1,
      username: "john_doe",
      email: "john@example.com",
      role: "user",
      status: "active",
      package: "Premium",
      expiresAt: "2024-02-15",
      maxConnections: 3,
      createdAt: "2023-11-01",
      lastLogin: "2024-01-14 10:30",
    },
    {
      id: 2,
      username: "jane_smith",
      email: "jane@example.com",
      role: "user",
      status: "active",
      package: "Basic",
      expiresAt: "2024-01-20",
      maxConnections: 1,
      createdAt: "2023-12-15",
      lastLogin: "2024-01-13 15:45",
    },
    {
      id: 3,
      username: "bob_wilson",
      email: "bob@example.com",
      role: "user",
      status: "trial",
      package: "Trial",
      expiresAt: "2024-01-18",
      maxConnections: 1,
      createdAt: "2024-01-10",
      lastLogin: "2024-01-14 08:20",
    },
    {
      id: 4,
      username: "alice_johnson",
      email: "alice@example.com",
      role: "reseller",
      status: "active",
      package: "Reseller",
      expiresAt: "2024-03-01",
      maxConnections: 10,
      createdAt: "2023-10-05",
      lastLogin: "2024-01-13 19:10",
    },
    {
      id: 5,
      username: "charlie_brown",
      email: "charlie@example.com",
      role: "user",
      status: "suspended",
      package: "Premium",
      expiresAt: "2024-01-25",
      maxConnections: 3,
      createdAt: "2023-09-20",
      lastLogin: "2024-01-10 12:00",
    },
    {
      id: 6,
      username: "diana_prince",
      email: "diana@example.com",
      role: "user",
      status: "expired",
      package: "Basic",
      expiresAt: "2024-01-05",
      maxConnections: 1,
      createdAt: "2023-11-10",
      lastLogin: "2024-01-05 14:30",
    },
  ];

  return json({ users });
}

export default function AdminUsers() {
  const { users } = useLoaderData<typeof loader>();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      trial: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      suspended: "bg-red-500/20 text-red-400 border-red-500/30",
      expired: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return badges[status as keyof typeof badges] || badges.active;
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      reseller: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      user: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    };
    return badges[role as keyof typeof badges] || badges.user;
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
          <p className="text-gray-400">Manage all users and their subscriptions</p>
        </div>
        <button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-purple-500/50 transition-all duration-200 flex items-center space-x-2 hover:scale-105">
          <PlusIcon className="w-5 h-5" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Filters and search */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <FunnelIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Connections
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-white/5 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.username}</p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadge(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                        user.status
                      )}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {user.package}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {user.expiresAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {user.maxConnections}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all">
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-all">
                        <KeyIcon className="w-5 h-5" />
                      </button>
                      {user.status === "active" ? (
                        <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all">
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      ) : (
                        <button className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-all">
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white/5 border-t border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="text-gray-400 text-sm">
            Showing {filteredUsers.length} of {users.length} users
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-all">
              Previous
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white font-medium transition-all">
              1
            </button>
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-all">
              2
            </button>
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-all">
              3
            </button>
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-all">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
