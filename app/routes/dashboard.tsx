import { json, LoaderArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  SignalIcon,
  FilmIcon,
  TvIcon,
  ClockIcon,
  HeartIcon,
  PlayIcon,
  StarIcon
} from "@heroicons/react/24/solid";
import { MagnifyingGlassIcon, Bars3Icon } from "@heroicons/react/24/outline";

export async function loader({ request }: LoaderArgs) {
  // TODO: Fetch real data from database
  const data = {
    featuredContent: {
      title: "Breaking Bad: The Complete Series",
      description:
        "A high school chemistry teacher turned methamphetamine manufacturer partners with a former student.",
      backdropUrl: "https://via.placeholder.com/1920x1080?text=Breaking+Bad",
      rating: 9.5,
      year: 2008,
      genres: ["Crime", "Drama", "Thriller"],
    },
    continueWatching: [
      {
        id: 1,
        title: "The Last of Us - S1 E3",
        thumbnail: "https://via.placeholder.com/300x170?text=TLOU",
        progress: 45,
        type: "series",
      },
      {
        id: 2,
        title: "Inception",
        thumbnail: "https://via.placeholder.com/300x170?text=Inception",
        progress: 72,
        type: "vod",
      },
      {
        id: 3,
        title: "Game of Thrones - S8 E4",
        thumbnail: "https://via.placeholder.com/300x170?text=GoT",
        progress: 23,
        type: "series",
      },
      {
        id: 4,
        title: "Interstellar",
        thumbnail: "https://via.placeholder.com/300x170?text=Interstellar",
        progress: 89,
        type: "vod",
      },
    ],
    popularLive: [
      {
        id: 1,
        name: "HBO Sports HD",
        thumbnail: "https://via.placeholder.com/200x113?text=HBO",
        category: "Sports",
        isLive: true,
      },
      {
        id: 2,
        name: "Discovery Channel",
        thumbnail: "https://via.placeholder.com/200x113?text=Discovery",
        category: "Documentary",
        isLive: true,
      },
      {
        id: 3,
        name: "CNN International",
        thumbnail: "https://via.placeholder.com/200x113?text=CNN",
        category: "News",
        isLive: true,
      },
      {
        id: 4,
        name: "Cartoon Network",
        thumbnail: "https://via.placeholder.com/200x113?text=CN",
        category: "Kids",
        isLive: true,
      },
    ],
    trendingMovies: [
      {
        id: 1,
        title: "Oppenheimer",
        poster: "https://via.placeholder.com/200x300?text=Oppenheimer",
        rating: 8.5,
        year: 2023,
      },
      {
        id: 2,
        title: "Dune: Part Two",
        poster: "https://via.placeholder.com/200x300?text=Dune",
        rating: 8.8,
        year: 2024,
      },
      {
        id: 3,
        title: "The Batman",
        poster: "https://via.placeholder.com/200x300?text=Batman",
        rating: 7.9,
        year: 2022,
      },
      {
        id: 4,
        title: "Everything Everywhere",
        poster: "https://via.placeholder.com/200x300?text=EEAAO",
        rating: 8.1,
        year: 2022,
      },
      {
        id: 5,
        title: "Top Gun: Maverick",
        poster: "https://via.placeholder.com/200x300?text=TopGun",
        rating: 8.3,
        year: 2022,
      },
    ],
  };

  return json(data);
}

export default function UserDashboard() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative">
        {/* Top Navigation */}
        <nav className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <SignalIcon className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-white font-bold text-xl">IPTV</h1>
                </div>
                <div className="hidden md:flex items-center space-x-6">
                  <Link
                    to="/dashboard"
                    className="text-white font-medium hover:text-purple-400 transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    to="/live"
                    className="text-gray-300 font-medium hover:text-white transition-colors"
                  >
                    Live TV
                  </Link>
                  <Link
                    to="/movies"
                    className="text-gray-300 font-medium hover:text-white transition-colors"
                  >
                    Movies
                  </Link>
                  <Link
                    to="/series"
                    className="text-gray-300 font-medium hover:text-white transition-colors"
                  >
                    Series
                  </Link>
                  <Link
                    to="/my-list"
                    className="text-gray-300 font-medium hover:text-white transition-colors"
                  >
                    My List
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-300 hover:text-white transition-colors">
                  <MagnifyingGlassIcon className="w-6 h-6" />
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer">
                  U
                </div>
                <button className="md:hidden p-2 text-gray-300 hover:text-white transition-colors">
                  <Bars3Icon className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Featured Hero Section */}
        <div className="relative h-[70vh] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${data.featuredContent.backdropUrl})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="max-w-2xl space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold text-white">
                {data.featuredContent.title}
              </h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <StarIcon className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-medium">
                    {data.featuredContent.rating}
                  </span>
                </div>
                <span className="text-gray-300">{data.featuredContent.year}</span>
                <div className="flex items-center space-x-2">
                  {data.featuredContent.genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-3 py-1 bg-white/10 backdrop-blur-xl rounded-full text-sm text-white"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-lg text-gray-300">
                {data.featuredContent.description}
              </p>
              <div className="flex items-center space-x-4">
                <button className="bg-white hover:bg-gray-200 text-black px-8 py-4 rounded-xl font-bold flex items-center space-x-2 transition-all duration-200 hover:scale-105">
                  <PlayIcon className="w-6 h-6" />
                  <span>Play Now</span>
                </button>
                <button className="bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white px-8 py-4 rounded-xl font-bold flex items-center space-x-2 transition-all duration-200 hover:scale-105">
                  <HeartIcon className="w-6 h-6" />
                  <span>My List</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
          {/* Continue Watching */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <ClockIcon className="w-7 h-7" />
                <span>Continue Watching</span>
              </h2>
              <button className="text-purple-400 hover:text-purple-300 font-medium">
                See all
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {data.continueWatching.map((item) => (
                <div
                  key={item.id}
                  className="group cursor-pointer space-y-3"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110">
                        <PlayIcon className="w-8 h-8 text-black ml-1" />
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-purple-500"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <h3 className="text-white font-medium line-clamp-1">
                    {item.title}
                  </h3>
                </div>
              ))}
            </div>
          </section>

          {/* Popular Live Channels */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <SignalIcon className="w-7 h-7" />
                <span>Popular Live Channels</span>
              </h2>
              <Link
                to="/live"
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                View all channels
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {data.popularLive.map((channel) => (
                <div
                  key={channel.id}
                  className="group cursor-pointer space-y-3"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10">
                    <img
                      src={channel.thumbnail}
                      alt={channel.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {channel.isLive && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-red-500 rounded-full text-white text-xs font-bold flex items-center space-x-1 animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <span>LIVE</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110">
                        <PlayIcon className="w-8 h-8 text-black ml-1" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-medium line-clamp-1">
                      {channel.name}
                    </h3>
                    <p className="text-gray-400 text-sm">{channel.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Trending Movies */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <FilmIcon className="w-7 h-7" />
                <span>Trending Movies</span>
              </h2>
              <Link
                to="/movies"
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                Browse all movies
              </Link>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
              {data.trendingMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="group cursor-pointer space-y-3"
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110">
                        <PlayIcon className="w-8 h-8 text-black ml-1" />
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/70 backdrop-blur-xl rounded-lg flex items-center space-x-1">
                      <StarIcon className="w-4 h-4 text-yellow-400" />
                      <span className="text-white text-sm font-medium">
                        {movie.rating}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-medium line-clamp-2">
                      {movie.title}
                    </h3>
                    <p className="text-gray-400 text-sm">{movie.year}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
