"use client";

import logo from "@/assets/update_logo.png";
import user from "@/assets/user.png";
import { Button } from "@/components/ui/button";
import {
  urlQueryParams,
  useWebSocket,
} from "@/utilities/websocket/WebSocketProvider";
import { AnimatePresence, motion } from "framer-motion";
import Cookies from "js-cookie";
import { ArrowRight, Gamepad2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserIdFromToken, sanitizeToken } from "@/lib/jwt";

const mergeInvitedGamesByRoomId = <T extends { roomId?: string }>(
  primary: T[],
  secondary: T[]
): T[] => {
  const seen = new Set<string>();
  const merged: T[] = [];

  const pushGame = (game: T) => {
    const roomId = typeof game?.roomId === "string" ? game.roomId : undefined;
    if (!roomId) {
      merged.push(game);
      return;
    }
    if (seen.has(roomId)) return;
    seen.add(roomId);
    merged.push(game);
  };

  for (const game of primary) pushGame(game);
  for (const game of secondary) pushGame(game);

  return merged;
};

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGameInvitationOpen, setIsGameInvitationOpen] = useState(false);
  const token = Cookies.get("accessToken");
  const xToken = urlQueryParams.xToken;
  const userId =
    getUserIdFromToken(sanitizeToken(xToken)) ??
    getUserIdFromToken(sanitizeToken(token));
  const { otherInvitedGames, newInvitation, sendEvent } = useWebSocket();
  const [allInvitedGames, setAllInvitedGames] = useState(
    otherInvitedGames?.games || []
  );

  const pathname = usePathname();

  // 1) On auth availability, request the latest invited-games list once.
  useEffect(() => {
    if (!token && !xToken) {
      setAllInvitedGames([]);
      return;
    }
    if (!userId) return;
    sendEvent({ type: "get-invited-games", userId });
  }, [sendEvent, token, userId, xToken]);

  // 2) When the server list updates, merge it into local state without wiping
  //    locally-received invitations that may arrive before the next server sync.
  useEffect(() => {
    if (!token && !xToken) return;
    const incoming = otherInvitedGames?.games || [];
    setAllInvitedGames(incoming);
  }, [otherInvitedGames?.games, token, xToken]);

  // 3) When a new invitation comes in, append with de-dupe.
  useEffect(() => {
    if (!token && !xToken) return;
    if (!newInvitation) return;
    setAllInvitedGames((prevGames) => {
      const existing = prevGames || [];
      return mergeInvitedGamesByRoomId(existing, [newInvitation]);
    });
  }, [newInvitation, token, xToken]);

  const navLinkClass = (path: string) =>
    `text-base font-medium transition-colors ${
      pathname === path ? "text-[#FF6EC7]" : "text-gray-700 hover:text-gray-900"
    }`;

  return (
    <div>
      <nav className="relative z-50 py-6">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-full shadow-lg px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src={logo}
                alt="Logo"
                className="w-10  h-10 object-contain"
              />
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-gray-900 leading-tight">
                  INTERNET
                </div>
                <div className="text-sm font-bold text-gray-900 leading-tight">
                  BACHELOR
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className={navLinkClass("/")}>
                Game
              </Link>
              <Link href="/message" className={navLinkClass("/message")}>
                Message
              </Link>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {token ? (
                <>
                  <div
                    onClick={() => setIsGameInvitationOpen(true)}
                    className="relative"
                  >
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#545f80] border-2 border-primary">
                      <Gamepad2 className="w-6 h-6 text-[#e6eced]" />
                    </div>
                    {allInvitedGames.length > 0 && (
                      <div className="absolute -top-1 px-[2px] -right-1 h-5 flex items-center justify-center rounded-full bg-red-600 border-2 border-primary text-white text-[10px] font-semibold">
                        {allInvitedGames.length}
                      </div>
                    )}
                  </div>
                  <div>
                    <Button>
                      <Link href={`/game/flappy-flight?isApp=true&x-token=${xToken}&userId=[6954a2a4986b21eea1288eab]&isHost=true`}>
                        Start
                      </Link>
                    </Button>
                  </div>
                  <Link href="/my-profile">
                    <Image
                      src={user}
                      alt="User Profile"
                      className="w-10 h-10 rounded-full border-2 border-primary"
                    />
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signup">
                    <Button
                      variant="outline"
                      className="rounded-full px-6 py-3 h-auto border border-primary text-gray-900 font-semibold hover:border-[#FF6EC7] hover:text-[#FF6EC7] transition-all bg-transparent"
                    >
                      Create an Account
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button className="rounded-full px-6 py-3 h-auto bg-primary hover:to-[#FF7CCB] text-white font-semibold shadow-lg flex items-center gap-2 transition-all">
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex flex-col gap-1.5 p-2"
            >
              <span
                className={`w-6 h-0.5 bg-gray-900 rounded transition-all ${
                  isMobileMenuOpen ? "rotate-45 translate-y-2" : ""
                }`}
              />
              <span
                className={`w-6 h-0.5 bg-gray-900 rounded transition-all ${
                  isMobileMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`w-6 h-0.5 bg-gray-900 rounded transition-all ${
                  isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              />
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="md:hidden mt-4 bg-white rounded-3xl shadow-lg p-6 space-y-4"
              >
                <Link
                  href="/"
                  className={`block ${navLinkClass("/")}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Game
                </Link>

                <Link
                  href="/message"
                  className={`block ${navLinkClass("/message")}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Message
                </Link>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <Link href="/signup" className="block">
                    <Button
                      variant="outline"
                      className="w-full rounded-full border-2 border-gray-200 text-gray-900 font-medium hover:border-[#FF6EC7] hover:text-[#FF6EC7] transition-all bg-transparent"
                    >
                      Create an Account
                    </Button>
                  </Link>
                  <Link href="/login" className="block">
                    <Button className="w-full rounded-full bg-gradient-to-r from-[#FF6EC7] to-[#FF8FDB] hover:from-[#FF5BB8] hover:to-[#FF7CCB] text-white font-medium shadow-lg flex items-center justify-center gap-2">
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isGameInvitationOpen ? (
              <GameInvitationModal
                onClose={() => setIsGameInvitationOpen(false)}
                gameInvitations={allInvitedGames}
              />
            ) : null}
          </AnimatePresence>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;

export const GameInvitationModal = ({
  onClose,
  gameInvitations,
}: {
  onClose: () => void;
  gameInvitations: {
    gameId: string;
    hostId: string;
    hostName: string;
    inviteLink: string;
    invitedAt: string;
    roomId: string;
  }[];
}) => {
  const token = Cookies.get("accessToken");
  return (
    <div className="fixed inset-0 z-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50"
      />

      {/*
        Use a scroll container so the modal remains reachable on short screens.
        The card itself is max-height constrained and its list area scrolls.
      */}
      <div
        className="relative h-full w-full overflow-y-auto p-4"
        onPointerDown={onClose}
      >
        <div className="min-h-full flex items-center justify-center">
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="bg-white rounded-2xl shadow-lg w-full max-w-md max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="p-6 pb-4">
              <h2 className="text-xl font-semibold">Game Invitations</h2>
              <p className="text-sm text-gray-600 mt-1">
                Your game invitations are here.
              </p>
            </div>

            <div className="px-6 pb-4 flex-1 overflow-y-auto">
              {gameInvitations.length === 0 ? (
                <p className="text-gray-500">
                  No game invitations at the moment.
                </p>
              ) : (
                <ul className="space-y-4">
                  {gameInvitations
                    ?.sort(
                      (a, b) =>
                        new Date(b.invitedAt).getTime() -
                        new Date(a.invitedAt).getTime()
                    )
                    .map((invitation) => (
                      <li
                        key={invitation.roomId}
                        className="border-b pb-4 last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              From: {invitation.hostName}
                            </p>
                            <p className="text-sm text-gray-600">
                              Invited at:{" "}
                              {new Date(invitation.invitedAt).toLocaleString()}
                            </p>
                            {(invitation.gameId || invitation.roomId) && (
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {invitation.gameId
                                  ? `Game: ${invitation.gameId}`
                                  : null}
                                {invitation.gameId && invitation.roomId
                                  ? " • "
                                  : null}
                                {invitation.roomId
                                  ? `Room: ${invitation.roomId}`
                                  : null}
                              </p>
                            )}
                          </div>

                          <Link
                            href={`/game/${invitation.gameId}?isApp=true&x-token=${token}&roomId=${invitation.roomId}&isHost=false`}
                            className="shrink-0"
                          >
                            <Button size="sm" className="px-4 text-white">
                              Join game
                            </Button>
                          </Link>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <div className="p-6 pt-4 flex justify-end gap-3 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-full px-4"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
