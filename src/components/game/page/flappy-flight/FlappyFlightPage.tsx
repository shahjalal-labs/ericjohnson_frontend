"use client";

import {
  urlQueryParams,
  useWebSocket,
} from "@/utilities/websocket/WebSocketProvider";
import dynamic from "next/dynamic";
import React, { useEffect } from "react";
import CreateRoom from "../../screens/CreateRoom";
import LeaderBoard from "../../screens/LeaderBoard";
import { usePathname, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import { getUserIdFromToken, sanitizeToken } from "@/lib/jwt";

const FlappyFlight3 = dynamic(
  () => import("@/components/game/FlappyFlight-copy-2"),
  {
    ssr: false,
  }
);

const FlappyFlightPage = () => {
  const { isConnected, isGameStarted, error, sendEvent } = useWebSocket();
  const [gameState, setGameState] = React.useState<
    "createRoom" | "loading" | "playing" | "leaderboard"
  >("loading");
  const [showErrorModal, setShowErrorModal] = React.useState(false);
  const [playClicked, setPlayClicked] = React.useState(false);
  const router = useRouter();
  const gameId: string = usePathname().split("/").pop() as string;
  const roomId = urlQueryParams.roomId as string;

  const token = Cookies.get("accessToken");
  const userId =
    getUserIdFromToken(sanitizeToken(urlQueryParams?.xToken)) ??
    getUserIdFromToken(sanitizeToken(token));

  useEffect(() => {
    // Simulate loading
    if (urlQueryParams?.queryParams) {
      setGameState("createRoom");
    }
  }, []);

  useEffect(() => {
    if (
      error?.message === "Invalid room" ||
      error?.message === "gameId & roomId not found"
    ) {
      sessionStorage.clear();
      setShowErrorModal(true);
    }
  }, [error, roomId]);

  // useEffect(() => {
  //   if (!isConnected) return;
  //   sendEvent({
  //     type: "get-invited-games",
  //   });
  // }, [isConnected, sendEvent]);

  useEffect(() => {
    if (!isConnected) return;
    if (!userId) return;
    sendEvent({ type: "get-invited-games", userId });
  }, [isConnected, sendEvent, userId]);

  useEffect(() => {
    if (!isGameStarted) return;
    if (isGameStarted.gameId !== gameId) return;
    setGameState((prev) => (prev === "leaderboard" ? prev : "playing"));
  }, [gameId, isGameStarted]);

  let content: React.ReactNode = null;

  if (gameState === "loading") {
    content = <div>Loading...</div>;
  } else if (gameState === "createRoom") {
    content = (
      <div>
        <CreateRoom
          playClicked={playClicked}
          setPlayClicked={setPlayClicked}
          gameId={gameId}
          setGameState={setGameState}
        />
      </div>
    );
  } else if (!isConnected) {
    content = <div>Connecting to game...</div>;
  } else if (
    gameState === "playing" &&
    isGameStarted &&
    isGameStarted.gameId === gameId
  ) {
    content = (
      <div>
        <FlappyFlight3
          gameId={gameId}
          roomId={isGameStarted?.roomId}
          setGameState={setGameState}
        />
      </div>
    );
  } else if (gameState === "leaderboard") {
    content = (
      <div>
        <LeaderBoard />
      </div>
    );
  }

  return (
    <>
      {content}

      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)", maxWidth: "400px" }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "white" }}>
              Opps... Invalid room!
            </DialogTitle>
            <div className="h-6"></div>
            <DialogDescription style={{ color: "white" }}>
              This game room is invalid or has expired. Please return to the
              home page and start again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setShowErrorModal(false);
                router.push("/");
              }}
            >
              Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FlappyFlightPage;
