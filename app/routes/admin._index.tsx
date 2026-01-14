import { json, LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  UsersIcon,
  SignalIcon,
  FilmIcon,
  TvIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  EyeIcon
} from "@heroicons/react/24/outline";

export async function loader({ request }: LoaderArgs) {
  // TODO: Fetch real data from database
  const stats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalStreams: 3451,
    activeStreams: 2103,
    totalVod: 8921,
    totalSeries: 342,
    totalRevenue: 45678.90,
    bandwidthUsage: "2.4 TB",
    userGrowth: 12.5,
    streamGrowth: -3.2,
    recentUsers: [
      { id: 1, username: "user123", email: "user123@example.com", status: "active", joinedAt: "2024-01-10" },
      { id: 2, username: "johnsmith", email: "john@example.com", status: "active", joinedAt: "2024-01-10" },
      { id: 3, username: "maryjane", email: "mary@example.com", status: "trial", joinedAt: "2024-01-09" },
      { id: 4, username: "bobwilson", email: "bob@example.com", status: "active", joinedAt: "2024-01-09" },
      { id: 5, username: "alice2024", email: "alice@example.com", status: "suspended", joinedAt: "2024-01-08" },
    ],
    popularStreams: [
      { id: 1, name: "HBO Sports HD", viewers: 1234, category: "Sports" },
      { id: 2, name: "Discovery Channel", viewers: 987, category: "Documentary" },
      { id: 3, name: "CNN International", viewers: 856, category: "News" },
      { id: 4, name: "Cartoon Network", viewers: 723, category: "Kids" },
      { id: 5, name: "ESPN HD", viewers: 654, category: "Sports" },
    ]
  };

  return json({ stats });
}

export default function AdminDashboard() {
  const { stats } = useLoaderData<typeof loader>();

  const statCards = [
    {
      name: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: stats.userGrowth,
      icon: UsersIcon,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      name: 'Active Streams',
      value: stats.activeStreams.toLocaleString(),
      change: stats.streamGrowth,
      icon: SignalIcon,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      name: 'VOD Content',
      value: stats.totalVod.toLocaleString(),
      change: 5.3,
      icon: FilmIcon,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      name: 'Series',
      value: stats.totalSeries.toLocaleString(),
      change: 8.1,
      icon: TvIcon,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, Admin! 👋
        </h1>
        <p className="text-gray-300">
          Here's what's happening with your IPTV service today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.change > 0;
          return (
            <div
              key={stat.name}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-xl`}>
                  <Icon className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} />
                </div>
                <div className={`flex items-center space-x-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? (
                    <ArrowTrendingUpIcon className="w-4 h-4" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4" />
                  )}
                  <span className="font-medium">{Math.abs(stat.change)}%</span>
                </div>
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">{stat.name}</h3>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent activity and popular streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <ClockIcon className="w-6 h-6" />
              <span>Recent Users</span>
            </h3>
            <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {stats.recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.username}</p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : user.status === 'trial'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {user.status}
                  </span>
                  <p className="text-gray-500 text-xs mt-1">{user.joinedAt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular streams */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <EyeIcon className="w-6 h-6" />
              <span>Popular Streams</span>
            </h3>
            <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {stats.popularStreams.map((stream, index) => (
              <div
                key={stream.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium">{stream.name}</p>
                    <p className="text-gray-400 text-sm">{stream.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <EyeIcon className="w-4 h-4" />
                  <span className="font-medium">{stream.viewers.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue and bandwidth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-gray-300 font-medium mb-2">Total Revenue</h3>
          <p className="text-4xl font-bold text-white mb-2">
            ${stats.totalRevenue.toLocaleString()}
          </p>
          <p className="text-green-400 text-sm flex items-center space-x-1">
            <ArrowTrendingUpIcon className="w-4 h-4" />
            <span>+15.3% from last month</span>
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-gray-300 font-medium mb-2">Bandwidth Usage</h3>
          <p className="text-4xl font-bold text-white mb-2">{stats.bandwidthUsage}</p>
          <p className="text-blue-400 text-sm flex items-center space-x-1">
            <ArrowTrendingUpIcon className="w-4 h-4" />
            <span>+8.1% from last month</span>
          </p>
        </div>
      </div>
    </div>
  );
}
