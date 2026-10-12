"use client";

import { Message } from "@/components/messages/Messag";
import { useGetMyProfileQuery } from "@/redux/api/userApi";
import Cookies from "js-cookie";

export default function MessagesPage() {
  const token = Cookies.get("accessToken") || "";
  const { data, isLoading } = useGetMyProfileQuery({});
  
  const userId = data?.result?.id || "";
  
  console.log("🔍 MessagesPage - Profile data:", {
    userId,
    userIdType: typeof userId,
    isLoading,
    fullProfile: data?.result
  });

  // Wait for userId to load
  if (isLoading || !userId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-zinc-400">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 container mx-auto px-4 w-full h-full pb-20">
        <Message token={token} userId={userId} />
      </div>
    </div>
  );
}
