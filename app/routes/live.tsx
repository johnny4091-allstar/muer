import { json, LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  HeartIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { PlayIcon, StarIcon } from "@heroicons/react/24/solid";

export async function loader({ request }: LoaderArgs) {
  // TODO: Fetch real data from database
  const categories = [
    { id: "all", name: "All Channels" },
    { id: "entertainment", name: "Entertainment" },
    { id: "sports", name: "Sports" },
    { id: "news", name: "News" },
    { id: "movies", name: "Movies" },
    { id: "kids", name: "Kids" },
  ];

  const channels = [
    {
      id: 1,
      name: "HBO Sports HD",
      category: "sports",
      thumbnail: "https://via.placeholder.com/200x113?text=HBO",
      isLive: true,
      streamUrl: "http://example.com/stream/hbo-sports.m3u8",
      currentProgram: {
        title: "NBA Finals - Lakers vs Celtics",
        startTime: "20:00",
        endTime: "23:00",
        progress: 45,
      },
      nextProgram: {
        title: "Post Game Analysis",
        startTime: "23:00",
        endTime: "23:30",
      },
    },
    {
      id: 2,
      name: "Discovery Channel HD",
      category: "entertainment",
      thumbnail: "https://via.placeholder.com/200x113?text=Discovery",
      isLive: true,
      streamUrl: "http://example.com/stream/discovery.m3u8",
      currentProgram: {
        title: "Planet Earth III",
        startTime: "21:00",
        endTime: "22:00",
        progress: 20,
      },
      nextProgram: {
        title: "How It's Made",
        startTime: "22:00",
        endTime: "22:30",
      },
    },
    {
      id: 3,
      name: "CNN International",
      category: "news",
      thumbnail: "https://via.placeholder.com/200x113?text=CNN",
      isLive: true,
      streamUrl: "http://example.com/stream/cnn.m3u8",
      currentProgram: {
        title: "World News Tonight",
        startTime: "20:00",
        endTime: "21:00",
        progress: 60,
      },
      nextProgram: {
        title: "Anderson Cooper 360",
        startTime: "21:00",
        endTime: "22:00",
      },
    },
    {
      id: 4,
      name: "Cartoon Network",
      category: "kids",
      thumbnail: "https://via.placeholder.com/200x113?text=CN",
      isLive: true,
      streamUrl: "http://example.com/stream/cartoon.m3u8",
      currentProgram: {
        title: "Adventure Time",
        startTime: "19:30",
        endTime: "20:00",
        progress: 75,
      },
      nextProgram: {
        title: "Regular Show",
        startTime: "20:00",
        endTime: "20:30",
      },
    },
    {
      id: 5,
      name: "ESPN HD",
      category: "sports",
      thumbnail: "https://via.placeholder.com/200x113?text=ESPN",
      isLive: true,
      streamUrl: "http://example.com/stream/espn.m3u8",
      currentProgram: {
        title: "NFL GameDay",
        startTime: "18:00",
        endTime: "21:00",
        progress: 85,
      },
      nextProgram: {
        title: "SportsCenter",
        startTime: "21:00",
        endTime: "22:00",
      },
    },
    {
      id: 6,
      name: "BBC World News",
      category: "news",
      thumbnail: "https://via.placeholder.com/200x113?text=BBC",
      isLive: true,
      streamUrl: "http://example.com/stream/bbc.m3u8",
      currentProgram: {
        title: "BBC News Hour",
        startTime: "20:00",
        endTime: "21:00",
        progress: 30,
      },
      nextProgram: {
        title: "Newsnight",
        startTime: "21:00",
        endTime: "22:00",
      },
    },
  ];

  return json({ categories, channels });
}

export default function LiveTV() {
  const { categories, channels } = useLoaderData<typeof loader>();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedChannel, setSelectedChannel] = useState(channels[0]);

  const filteredChannels = channels.filter((channel) => {
    const matchesCategory =
      selectedCategory === "all" || channel.category === selectedCategory;
    const matchesSearch = channel.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative">
        {/* Player Section */}
        <div className="bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-4">
              {/* Video Player */}
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto">
                      <PlayIcon className="w-10 h-10 text-white ml-1" />
                    </div>
                    <p className="text-white text-lg">
                      Click to start streaming
                    </p>
                    <p className="text-gray-400 text-sm">
                      {selectedChannel.streamUrl}
                    </p>
                  </div>
                </div>
              </div>

              {/* Now Playing Info */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <img
                      src={selectedChannel.thumbnail}
                      alt={selectedChannel.name}
                      className="w-24 h-14 rounded-lg object-cover"
                    />
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <h2 className="text-2xl font-bold text-white">
                          {selectedChannel.name}
                        </h2>
                        <span className="px-3 py-1 bg-red-500 rounded-full text-white text-xs font-bold flex items-center space-x-1 animate-pulse">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                          <span>LIVE</span>
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="w-4 h-4 text-purple-400" />
                          <p className="text-white font-medium">
                            {selectedChannel.currentProgram.title}
                          </p>
                          <span className="text-gray-400 text-sm">
                            {selectedChannel.currentProgram.startTime} -{" "}
                            {selectedChannel.currentProgram.endTime}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-full max-w-md h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                              style={{
                                width: `${selectedChannel.currentProgram.progress}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-gray-400 text-xs">
                            {selectedChannel.currentProgram.progress}%
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          Up Next: {selectedChannel.nextProgram.title} (
                          {selectedChannel.nextProgram.startTime})
                        </p>
                      </div>
                    </div>
                  </div>
                  <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                    <HeartIcon className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Channels Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white">Live Channels</h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-purple-500 text-white"
                      : "bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-purple-500 text-white"
                      : "bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search channels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Category filters */}
                <div className="flex items-center space-x-3 overflow-x-auto">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                        selectedCategory === category.id
                          ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50"
                          : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Channels Grid/List */}
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {filteredChannels.map((channel) => (
                <div
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel)}
                  className={`cursor-pointer transition-all duration-200 ${
                    viewMode === "grid"
                      ? "group"
                      : "bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10"
                  } ${
                    selectedChannel.id === channel.id
                      ? "ring-2 ring-purple-500"
                      : ""
                  }`}
                >
                  {viewMode === "grid" ? (
                    <div className="space-y-3">
                      <div className="relative aspect-video rounded-xl overflow-hidden">
                        <img
                          src={channel.thumbnail}
                          alt={channel.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3 px-2 py-1 bg-red-500 rounded-full text-white text-xs font-bold flex items-center space-x-1 animate-pulse">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          <span>LIVE</span>
                        </div>
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <PlayIcon className="w-6 h-6 text-black ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-white font-medium line-clamp-1">
                          {channel.name}
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-1">
                          {channel.currentProgram.title}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <img
                        src={channel.thumbnail}
                        alt={channel.name}
                        className="w-32 h-18 rounded-lg object-cover"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-white font-medium">
                            {channel.name}
                          </h3>
                          <span className="px-2 py-0.5 bg-red-500 rounded-full text-white text-xs font-bold">
                            LIVE
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">
                          {channel.currentProgram.title}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {channel.currentProgram.startTime} -{" "}
                          {channel.currentProgram.endTime}
                        </p>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{
                              width: `${channel.currentProgram.progress}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <PlayIcon className="w-8 h-8 text-purple-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
