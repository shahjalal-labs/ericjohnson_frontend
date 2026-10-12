"use client";
import { useSendFriendRequestMutation } from "@/redux/api/friendsApi";
import { useGetUserInfoQuery } from "@/redux/api/userApi";
import { format } from "date-fns";
import {
  Briefcase,
  Calendar,
  Check,
  Clock,
  Heart,
  Languages,
  Loader2,
  MapPin,
  Phone,
  Ruler,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  profileImage: string;
  fullName: string;
  bio: string;
  phoneNumber: string;
  gender: string;
  dob: string;
  galleryImage1: string | null;
  galleryImage2: string | null;
  galleryImage3: string | null;
  galleryImage4: string | null;
  galleryImage5: string | null;
  galleryImage6: string | null;
  profession: string;
  address: string;
  religiousBeliefs: string;
  politics: string;
  languages: string;
  intention: string;
  height: number;
  myEthnicity: string;
  myChildren: string;
  familyPlans: string;
  vices: string[] | Record<string, any>[];
  maxDistance: number;
  interestedIn: string;
  minAge: number;
  maxAge: number;
  relationship: string;
  ethnicity: string[];
  isEthnicityBreak: boolean;
  religion: string[];
  isReligionBreak: boolean;
  interests: string[];
  role: string;
  createdAt: string;
  updatedAt: string;
  friendStatus: string | null;
  friendShipId: string;
}

interface UserApiResponse {
  success: boolean;
  message: string;
  result: UserProfile;
}

interface InterestItem {
  icon: string;
  label: string;
}

export default function Profile() {
  const params = useParams();
  const id = params.id as string;
  const { data: userInfoData, isLoading, refetch } = useGetUserInfoQuery(id);
  const [sendFriendRequest, { isLoading: isAddingFriend }] =
    useSendFriendRequestMutation();

  // State to manage friend status locally for immediate UI feedback
  const [localFriendStatus, setLocalFriendStatus] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (userInfoData?.result) {
      setLocalFriendStatus(userInfoData.result.friendStatus);
    }
  }, [userInfoData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  if (!userInfoData?.result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">User not found</div>
      </div>
    );
  }

  const user = (userInfoData as UserApiResponse).result;

  // Calculate age from DOB
  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "MM/dd/yyyy");
    } catch (error) {
      if(error)
        return "Invalid date";
      return "Invalid date";
    }
  };

  // Get gallery images (excluding null values)
  const galleryImages: string[] = [
    user.galleryImage1,
    user.galleryImage2,
    user.galleryImage3,
    user.galleryImage4,
    user.galleryImage5,
    user.galleryImage6,
  ].filter((img): img is string => img !== null && typeof img === "string");

  // Parse interests from the array
  const interests: InterestItem[] = Array.isArray(user.interests)
    ? user.interests.map((interest: string) => {
        // Extract emoji and label
        const match = interest.match(/^(\p{Emoji})\s*(.+)$/u);
        if (match) {
          return {
            icon: match[1],
            label: match[2],
          };
        }
        return {
          icon: "🌟",
          label: interest,
        };
      })
    : [];

  // Safely handle vices - extract string values from objects if needed
  const getViceLabels = (): string[] => {
    if (!user.vices || !Array.isArray(user.vices)) return [];

    return user.vices
      .map((vice: string | Record<string, any>) => {
        if (typeof vice === "string") {
          return vice;
        } else if (typeof vice === "object" && vice !== null) {
          // If vice is an object, try to get a string representation
          if (vice.label || vice.name) {
            return vice.label || vice.name || "Vice";
          }
          // If object has keys like {Alcohol: true}, use the key name
          const keys = Object.keys(vice);
          if (keys.length > 0) {
            return keys[0];
          }
        }
        return "Unknown";
      })
      .filter((vice: string) => vice.trim() !== "");
  };

  const viceLabels = getViceLabels();

  // add friend handler
  const handleAddFriend = async (userId: string) => {
    try {
      // Update local state immediately for better UX
      setLocalFriendStatus("sent");

      const response = await sendFriendRequest(userId).unwrap();

      if (response.success) {
        toast.success("Friend request sent successfully!");
        // Refetch user data to get updated friend status
        refetch();
      }
    } catch (error: any) {
      // Revert local state on error
      setLocalFriendStatus(user.friendStatus);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to send friend request."
      );
    }
  };

  // Determine which button to show
  const renderFriendButton = () => {
    const currentStatus = localFriendStatus || user.friendStatus;

    switch (currentStatus) {
      case "friends":
        return (
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-20 py-3 rounded-full font-semibold transition-all shadow-lg flex items-center justify-center gap-2">
            <Check className="w-5 h-5" />
            Friends
          </button>
        );

      case "sent":
        return (
          <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 sm:px-20 py-3 rounded-full font-semibold transition-all shadow-lg flex items-center justify-center gap-2">
            <Clock className="w-5 h-5" />
            Request Sent
          </button>
        );

      case "received":
        return (
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-20 py-3 rounded-full font-semibold transition-all shadow-lg flex items-center justify-center gap-2">
            <UserPlus className="w-5 h-5" />
            Respond to Request
          </button>
        );

      default: // null or any other status
        return (
          <button
            onClick={() => handleAddFriend(user.id)}
            disabled={isAddingFriend}
            className="bg-primary text-white px-6 sm:px-20 py-3 rounded-full font-semibold transition-all shadow-lg shadow-pink-500/30 whitespace-nowrap hover:bg-pink-600 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAddingFriend ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Add Friend
              </>
            )}
          </button>
        );
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-[#FF6EC7] to-[#9B4DFF] h-[280px]"></div>
      <div className="max-w-5xl mx-auto px-4">
        {/* Profile Header */}
        <div className="relative mb-6 bottom-24">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-purple-500">
            <Image
              src={
                user.profileImage ||
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
              }
              alt={user.fullName}
              className="w-full h-full object-cover"
              width={160}
              height={160}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
            <div>
              <h1 className="text-white text-3xl font-bold">{user.fullName}</h1>
              <p className="text-gray-300 mt-1">{user.profession}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/message?id=${user?.id}`}
                className="bg-purple-900/50 hover:bg-purple-800/60 text-white px-6 sm:px-20 py-3 rounded-full font-semibold transition-all border border-purple-500/30 whitespace-nowrap"
              >
                Message
              </Link>
              {renderFriendButton()}
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="bg-[#212121] backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/10">
          <h2 className="text-white text-lg font-semibold mb-3">Bio</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            {user.bio || "No bio provided"}
          </p>
        </div>

        {/* Interests Section */}
        {interests.length > 0 && (
          <div className="bg-[#212121] backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/10">
            <h2 className="text-white text-lg font-semibold mb-4">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest: InterestItem, index: number) => (
                <span
                  key={index}
                  className="bg-gray-800/60 hover:bg-gray-700/60 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-colors border border-white/10"
                >
                  <span>{interest.icon}</span>
                  <span>{interest.label}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Gallery Section */}
        {galleryImages.length > 0 && (
          <div className="bg-[#212121] backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/10">
            <h2 className="text-white text-lg font-semibold mb-4">Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {galleryImages.map((pic: string, index: number) => (
                <div
                  key={index}
                  className="aspect-[3/4] rounded-xl overflow-hidden hover:scale-105 transition-transform cursor-pointer"
                >
                  <Image
                    src={pic}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
                    width={300}
                    height={400}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop";
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="bg-[#212121] backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/10">
          <h2 className="text-white text-lg font-semibold mb-4">Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-300">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-sm">
                {user.phoneNumber || "Not provided"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-sm">{user.gender || "Not specified"}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="text-sm">
                {user.address || "Location not specified"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm">
                {user.dob
                  ? `${formatDate(user.dob)} (${calculateAge(user.dob)} years)`
                  : "Date of birth not provided"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Ruler className="w-5 h-5 text-gray-400" />
              <span className="text-sm">
                {user.height ? `${user.height} cm` : "Height not specified"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Briefcase className="w-5 h-5 text-gray-400" />
              <span className="text-sm">
                {user.profession || "Profession not specified"}
              </span>
            </div>
            {user.languages && (
              <div className="flex items-center gap-3 text-gray-300">
                <Languages className="w-5 h-5 text-gray-400" />
                <span className="text-sm">{user.languages}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dating Preferences */}
        <div className="bg-[#212121] backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/10">
          <h2 className="text-white text-lg font-semibold mb-3">
            Dating Preferences
          </h2>
          <div className="space-y-2">
            <p className="text-gray-300 text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Interested in: {user.interestedIn || "Not specified"}
            </p>
            <p className="text-gray-300 text-sm">
              Age range: {user.minAge} - {user.maxAge} years
            </p>
            <p className="text-gray-300 text-sm">
              Max distance:{" "}
              {user.maxDistance ? `${user.maxDistance} km` : "Any distance"}
            </p>
          </div>
        </div>

        {/* Relationship Preferences */}
        <div className="bg-[#212121] backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/10">
          <h2 className="text-white text-lg font-semibold mb-3">
            Relationship Preferences
          </h2>
          <p className="text-gray-300 text-sm flex items-center gap-2">
            <Heart className="w-4 h-4" />
            {user.relationship || "Not specified"}
          </p>
        </div>

        {/* My Ethnicity */}
        <div className="bg-[#212121] backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/10">
          <h2 className="text-white text-lg font-semibold mb-3">
            My Ethnicity
          </h2>
          <p className="text-gray-300 text-sm">
            {user.myEthnicity || "Not specified"}
          </p>
        </div>

        {/* Preferred Ethnicities */}
        {Array.isArray(user.ethnicity) && user.ethnicity.length > 0 && (
          <div className="bg-[#212121] backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/10">
            <h2 className="text-white text-lg font-semibold mb-3">
              Preferred Ethnicities
            </h2>
            <div className="space-y-2">
              {user.ethnicity.map((ethnicity: string, index: number) => (
                <p key={index} className="text-gray-300 text-sm">
                  • {ethnicity}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Family Information */}
        <div className="bg-[#212121] backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/10">
          <h2 className="text-white text-lg font-semibold mb-3">
            Family Information
          </h2>
          <div className="space-y-2">
            <p className="text-gray-300 text-sm">
              Children: {user.myChildren || "Not specified"}
            </p>
            <p className="text-gray-300 text-sm">
              Family Plans: {user.familyPlans || "Not specified"}
            </p>
          </div>
        </div>

        {/* Religious Beliefs */}
        <div className="bg-[#212121] backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/10">
          <h2 className="text-white text-lg font-semibold mb-3">
            Religious Beliefs
          </h2>
          <div className="space-y-2">
            <p className="text-gray-300 text-sm">
              My religion: {user.religiousBeliefs || "Not specified"}
            </p>
            {Array.isArray(user.religion) && user.religion.length > 0 && (
              <>
                <p className="text-gray-300 text-sm mt-2">Open to:</p>
                {user.religion.map((religion: string, index: number) => (
                  <p key={index} className="text-gray-300 text-sm ml-2">
                    • {religion}
                  </p>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Politics */}
        {user.politics && (
          <div className="bg-[#212121] backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/10">
            <h2 className="text-white text-lg font-semibold mb-3">
              Political Views
            </h2>
            <p className="text-gray-300 text-sm">{user.politics}</p>
          </div>
        )}

        {/* Vices */}
        {viceLabels.length > 0 && (
          <div className="bg-[#212121] backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/10">
            <h2 className="text-white text-lg font-semibold mb-3">Lifestyle</h2>
            <div className="space-y-2">
              {viceLabels.map((vice: string, index: number) => (
                <p key={index} className="text-gray-300 text-sm">
                  • {vice}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Dating Intention */}
        <div className="bg-[#212121] backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/10">
          <h2 className="text-white text-lg font-semibold mb-3">
            Dating Intention
          </h2>
          <p className="text-gray-300 text-sm">
            {user.intention || "Not specified"}
          </p>
        </div>
      </div>
    </div>
  );
}
