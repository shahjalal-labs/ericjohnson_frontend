"use client";

import frame1 from "@/assets/Frame1.png";
import frame2 from "@/assets/Frame2.png";
import { useGetMyFriendsQuery } from "@/redux/api/friendsApi";
import { useGetAllMatchesQuery } from "@/redux/api/matchApi";
import { motion } from "framer-motion";
import Cookies from "js-cookie";
import { Check, ChevronRight, Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const FlappyFlight = dynamic(
  () => import("@/components/game/FlappyFlight").then((mod) => mod.default),
  { ssr: false }
);

const games = [
  {
    id: 1,
    name: "Game 01",
    background: `url(${frame1.src})`,
  },
  {
    id: 2,
    name: "Game 02",
    background: `url(${frame2.src})`,
  },
];

export default function GamesSection() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"play" | "connect">("play");
  const [connectSubTab, setConnectSubTab] = useState<"matches" | "friends">(
    "matches"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);

  const { data: getAllMatchesData, isLoading: matchesLoading } =
    useGetAllMatchesQuery({});
  const { data: getMyFriendsData, isLoading: friendsLoading } =
    useGetMyFriendsQuery({});

  // const token = Cookies.get("accessToken");

  const matchesProfiles = useMemo(
    () => getAllMatchesData?.result ?? [],
    [getAllMatchesData]
  );
  const friendsProfiles = useMemo(
    () => getMyFriendsData?.result?.friends ?? [],
    [getMyFriendsData]
  );

  // Filter profiles based on search query
  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) {
      return connectSubTab === "matches" ? matchesProfiles : friendsProfiles;
    }

    const profiles =
      connectSubTab === "matches" ? matchesProfiles : friendsProfiles;

    return profiles.filter((profile: any) => {
      const fullName = profile.fullName || "";
      const email = profile.email || "";
      const query = searchQuery.toLowerCase();

      return (
        fullName.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, connectSubTab, matchesProfiles, friendsProfiles]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const toggleProfileSelection = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProfiles((prev) =>
      prev.includes(profileId)
        ? prev.filter((selectedId) => selectedId !== profileId)
        : [...prev, profileId]
    );
  };

  const handleProfileClick = (profileId: string) => {
    router.push(`/profile/${profileId}`);
  };

  // Add this function after other handlers
  // Add this function after other handlers
  const handlePlayWithFriends = () => {
    if (selectedProfiles.length === 0) return;

    // Get the token from cookies
    const token = Cookies.get("accessToken") || "";

    // Create array string without quotes around IDs
    const userIdsParam = `[${selectedProfiles.join(",")}]`;

    // Construct the URL
    const gameUrl = `/game/flappy-flight?isApp=true&x-token=${encodeURIComponent(
      token
    )}&userId=${userIdsParam}&isHost=true`;

    // Navigate to the game
    router.push(gameUrl);
  };

  // Function to render profiles grid
  const renderProfilesGrid = (profiles: any[]) => {
    if (profiles.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-400">
            {searchQuery.trim()
              ? "No profiles found matching your search"
              : `No ${connectSubTab} found`}
          </p>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {profiles.map((profile: any, index: number) => {
          const profileId = profile.id || profile._id || String(profile.userId);
          const profileImage = profile.profileImage;
          const fullName = profile.fullName || "Unknown User";
          const email = profile.email || "";

          return (
            <motion.div
              key={profileId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="relative rounded-2xl overflow-hidden group cursor-pointer"
              onClick={() => handleProfileClick(profileId)}
            >
              <div className="aspect-[3/4] relative">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                    <span className="text-white text-2xl font-semibold">
                      {fullName.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Profile Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-1 truncate">
                        {fullName}
                      </h3>
                      <p className="text-sm text-gray-300 truncate">{email}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors flex-shrink-0" />
                  </div>
                </div>

                {/* Top Right Select Button */}
                <button
                  onClick={(e) => toggleProfileSelection(profileId, e)}
                  className={`absolute top-4 right-4 w-8 h-8 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                    selectedProfiles.includes(profileId)
                      ? "bg-primary border-primary"
                      : "bg-white/20 border-white/30"
                  }`}
                >
                  {selectedProfiles.includes(profileId) ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </button>

                {/* Bottom Right Message Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle message functionality here
                    router.push(`/message?id=${profileId}`);
                  }}
                  className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-primary hover:bg-pink-500 flex items-center justify-center transition-all hover:scale-110 shadow-lg z-10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-white"
                  >
                    <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
                    <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
                  </svg>
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  return (
    <section className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-visible">
      <div
        className="absolute -right-[200px] top-0 -translate-y-1/2 blur-[200px] opacity-70 pointer-events-none"
        style={{
          backgroundColor: "#9B4DFF",
          width: "450px",
          height: "450px",
        }}
      />
      <div className="container mx-auto space-y-12 relative">
        {/* ================= Tabs ================= */}
        <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-full max-w-[580px] mx-auto p-1">
          <button
            onClick={() => setActiveTab("play")}
            className={`flex-1 py-3 rounded-full font-semibold transition-all duration-300 ${
              activeTab === "play"
                ? "bg-primary text-white"
                : "text-white hover:bg-white/10"
            }`}
          >
            Play
          </button>

          <button
            onClick={() => setActiveTab("connect")}
            className={`flex-1 py-3 rounded-full font-semibold transition-all duration-300 ${
              activeTab === "connect"
                ? "bg-primary text-white"
                : "text-white hover:bg-white/10"
            }`}
          >
            Connect
          </button>
        </div>

        {/* ================= PLAY TAB CONTENT ================= */}
        {activeTab === "play" && (
          <>
            {/* ================= GAME 01 ================= */}
            <div className="relative">
              {/* LEFT OUTSIDE GLOW */}
              <div
                className="absolute -left-[200px] top-1/2 -translate-y-1/2 blur-[200px] opacity-70 pointer-events-none"
                style={{
                  backgroundColor: "#9B4DFF",
                  width: "450px",
                  height: "450px",
                }}
              />

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative z-10"
              >
                <div
                  className="relative rounded-3xl overflow-hidden bg-cover bg-center flex items-center justify-center"
                  style={{
                    backgroundImage: games[0].background,
                    minHeight: "780px",
                  }}
                >
                  <div className="flex flex-col items-center justify-center text-center gap-6 px-4">
                    <h2 className="font-pressstart text-[#39FF14] text-2xl sm:text-3xl md:text-4xl lg:text-[40px]">
                      {games[0].name}
                    </h2>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ================= GAME 02 ================= */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="relative z-10"
              >
                <div
                  className="relative rounded-3xl overflow-hidden bg-cover bg-center flex items-center justify-center"
                  style={{
                    backgroundImage: games[1].background,
                    minHeight: "780px",
                  }}
                >
                  <div className="flex flex-col items-center justify-center text-center gap-6 px-4">
                    <h2 className="font-pressstart text-[#39FF14] text-2xl sm:text-3xl md:text-4xl lg:text-[40px]">
                      {games[1].name}
                    </h2>
                    <FlappyFlight />
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}

        {/* ================= CONNECT TAB CONTENT ================= */}
        {activeTab === "connect" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-5xl mx-auto space-y-8"
          >
            {/* Search Bar */}
            <div className="relative">
              <div className="relative flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-4 text-white placeholder:text-gray-400 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Matches/Friends Tabs */}
            <div className="flex items-center border-b border-white/10">
              <button
                onClick={() => {
                  setConnectSubTab("matches");
                  setSelectedProfiles([]); // Clear selection when switching tabs
                }}
                className={`flex-1 py-4 text-center font-medium transition-all duration-300 relative ${
                  connectSubTab === "matches"
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                Matches
                {connectSubTab === "matches" && (
                  <motion.div
                    layoutId="activeSubTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
              <button
                onClick={() => {
                  setConnectSubTab("friends");
                  setSelectedProfiles([]); // Clear selection when switching tabs
                }}
                className={`flex-1 py-4 text-center font-medium transition-all duration-300 relative ${
                  connectSubTab === "friends"
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                Friends
                {connectSubTab === "friends" && (
                  <motion.div
                    layoutId="activeSubTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            </div>

            {/* Loading State */}
            {(matchesLoading && connectSubTab === "matches") ||
            (friendsLoading && connectSubTab === "friends") ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Loading...</p>
              </div>
            ) : (
              <>
                {/* Profile Grid */}
                {renderProfilesGrid(filteredProfiles)}

                {/* Play Button at Bottom */}
                {filteredProfiles.length > 0 && (
                  <div className="flex justify-center pt-8">
                    <button
                      onClick={handlePlayWithFriends}
                      className={`px-16 py-4 rounded-full font-semibold hover:shadow-lg transition-all duration-300 text-lg ${
                        selectedProfiles.length > 0
                          ? "bg-primary hover:bg-pink-500 text-white hover:shadow-pink-500/70"
                          : "bg-gray-600 text-gray-300 cursor-not-allowed"
                      }`}
                      disabled={selectedProfiles.length === 0}
                    >
                      {selectedProfiles.length > 0
                        ? `Play with ${selectedProfiles.length} friend${
                            selectedProfiles.length !== 1 ? "s" : ""
                          }`
                        : "Select profiles to play"}
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
