import { json, LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  SignalIcon,
  EyeIcon,
  PlayIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";

export async function loader({ request }: LoaderArgs) {
  // TODO: Fetch real data from database
  const categories = [
    { id: 1, name: "Entertainment", channelCount: 45 },
    { id: 2, name: "Sports", channelCount: 32 },
    { id: 3, name: "News", channelCount: 28 },
    { id: 4, name: "Movies", channelCount: 38 },
    { id: 5, name: "Kids", channelCount: 24 },
  ];

  const streams = [
    {
      id: 1,
      name: "HBO Sports HD",
      category: "Sports",
      streamUrl: "http://example.com/stream/hbo-sports.m3u8",
      iconUrl: "https://via.placeholder.com/100x100?text=HBO",
      epgChannelId: "hbo-sports",
      isActive: true,
      viewers: 1234,
      bitrate: "4 Mbps",
    },
    {
      id: 2,
      name: "Discovery Channel HD",
      category: "Entertainment",
      streamUrl: "http://example.com/stream/discovery.m3u8",
      iconUrl: "https://via.placeholder.com/100x100?text=Discovery",
      epgChannelId: "discovery",
      isActive: true,
      viewers: 987,
      bitrate: "3.5 Mbps",
    },
    {
      id: 3,
      name: "CNN International",
      category: "News",
      streamUrl: "http://example.com/stream/cnn.m3u8",
      iconUrl: "https://via.placeholder.com/100x100?text=CNN",
      epgChannelId: "cnn-int",
      isActive: true,
      viewers: 856,
      bitrate: "2.5 Mbps",
    },
    {
      id: 4,
      name: "Cartoon Network",
      category: "Kids",
      streamUrl: "http://example.com/stream/cartoon.m3u8",
      iconUrl: "https://via.placeholder.com/100x100?text=CN",
      epgChannelId: "cartoon-network",
      isActive: true,
      viewers: 723,
      bitrate: "3 Mbps",
    },
    {
      id: 5,
      name: "ESPN HD",
      category: "Sports",
      streamUrl: "http://example.com/stream/espn.m3u8",
      iconUrl: "https://via.placeholder.com/100x100?text=ESPN",
      epgChannelId: "espn-hd",
      isActive: false,
      viewers: 0,
      bitrate: "4.5 Mbps",
    },
    {
      id: 6,
      name: "BBC World News",
      category: "News",
      streamUrl: "http://example.com/stream/bbc.m3u8",
      iconUrl: "https://via.placeholder.com/100x100?text=BBC",
      epgChannelId: "bbc-world",
      isActive: true,
      viewers: 654,
      bitrate: "3 Mbps",
    },
  ];

  return json({ categories, streams });
}

export default function AdminLiveTV() {
  const { categories, streams } = useLoaderData<typeof loader>();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const filteredStreams = streams.filter((stream) => {
    const matchesSearch = stream.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterCategory === "all" || stream.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Live TV Streams</h1>
          <p className="text-gray-400">
            Manage live TV channels and streams
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5" />
            <span>Manage Categories</span>
          </button>
          <button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-purple-500/50 transition-all duration-200 flex items-center space-x-2 hover:scale-105">
            <PlusIcon className="w-5 h-5" />
            <span>Add Stream</span>
          </button>
        </div>
      </div>

      {/* Categories overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-200 cursor-pointer hover:scale-105"
          >
            <div className="flex items-center justify-between mb-2">
              <SignalIcon className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-gray-400">
                {category.channelCount} channels
              </span>
            </div>
            <h3 className="text-white font-medium">{category.name}</h3>
          </div>
        ))}
      </div>

      {/* Filters and search */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <FunnelIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer transition-all"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Streams table */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Stream URL
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Bitrate
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Viewers
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredStreams.map((stream) => (
                <tr
                  key={stream.id}
                  className="hover:bg-white/5 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <img
                        src={stream.iconUrl}
                        alt={stream.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-white font-medium">{stream.name}</p>
                        <p className="text-gray-400 text-sm">
                          EPG: {stream.epgChannelId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {stream.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-gray-300 text-sm truncate">
                      {stream.streamUrl}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {stream.bitrate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <EyeIcon className="w-4 h-4" />
                      <span>{stream.viewers.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        stream.isActive
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {stream.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-all">
                        <PlayIcon className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all">
                        <PencilIcon className="w-5 h-5" />
                      </button>
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
            Showing {filteredStreams.length} of {streams.length} streams
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-all">
              Previous
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white font-medium transition-all">
              1
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
