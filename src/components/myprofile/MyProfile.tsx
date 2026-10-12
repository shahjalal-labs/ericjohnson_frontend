"use client";
import {
  useDeleteAccountMutation,
  useGetMyProfileQuery,
} from "@/redux/api/userApi";
import { format } from "date-fns";
import Cookies from "js-cookie";
import {
  Briefcase,
  Calendar,
  Edit2,
  Languages,
  Lock,
  LogOut,
  MapPin,
  Phone,
  Ruler,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import Swal from "sweetalert2";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  visiblePhoneNumber: boolean;
  profileImage: string;
  gender: string;
  visibleGender: boolean;
  galleryImage1: string | null;
  galleryImage2: string | null;
  galleryImage3: string | null;
  galleryImage4: string | null;
  galleryImage5: string | null;
  galleryImage6: string | null;
  dob: string;
  visibleDob: boolean;
  profession: string;
  visibleProfession: boolean;
  bio: string;
  visibleBio: boolean;
  address: string;
  visibleAddress: boolean;
  religiousBeliefs: string;
  visibleReligiousBeliefs: boolean;
  politics: string;
  visiblePolitics: boolean;
  languages: string;
  visibleLanguages: boolean;
  intention: string;
  visibleIntention: boolean;
  height: number;
  visibleHeight: boolean;
  myEthnicity: string;
  visibleMyEthnicity: boolean;
  myChildren: string;
  visibleMyChildren: boolean;
  familyPlans: string;
  visibleFamilyPlans: boolean;
  vices: string[] | Record<string, any>[];
  visibleVices: boolean;
  maxDistance: number;
  interestedIn: string;
  minAge: number;
  maxAge: number;
  relationship: string;
  ethinicity: string[];
  isEthnicityBreak: boolean;
  religion: string[];
  isReligionBreak: boolean;
  interests: string[];
  friendsCount: number;
  matchedCount: number;
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

export default function MyProfile() {
  const { data: myProfileData, isLoading } = useGetMyProfileQuery({});
  const [deleteAccountFn, { isLoading: isDeleting }] =
    useDeleteAccountMutation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans pb-10 flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  if (!myProfileData?.result) {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans pb-10 flex items-center justify-center">
        <div className="text-white">Profile not found</div>
      </div>
    );
  }

  const user = (myProfileData as UserApiResponse).result;

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
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (error) {
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

  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      title: "Delete Account?",
      html: `
        <div class="text-left">
          <p class="text-red-500 mb-2">Are you sure you want to delete your account?</p>
          <p class="text-sm text-gray-600 mb-4">This action cannot be undone. All your data will be permanently removed.</p>
          <div class="bg-red-50 p-3 rounded border border-red-200">
            <p class="text-sm text-red-700 font-semibold mb-1">Warning:</p>
            <ul class="text-xs text-red-600 list-disc pl-4 space-y-1">
              <li>Your profile will be permanently deleted</li>
              <li>All matches and messages will be lost</li>
              <li>You will be logged out immediately</li>
              <li>This action cannot be reversed</li>
            </ul>
          </div>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, keep my account",
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          const response = await deleteAccountFn({}).unwrap();
          return response;
        } catch (error: any) {
          Swal.showValidationMessage(
            `Error: ${error?.data?.message || "Failed to delete account"}`
          );
          return false;
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
    });

    if (result.isConfirmed) {
      if (result.value?.success) {
        // Remove token and redirect
        Cookies.remove("accessToken");

        await Swal.fire({
          title: "Account Deleted!",
          text: "Your account has been successfully deleted.",
          icon: "success",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Go to Homepage",
        });

        window.location.href = "/signup";
      } else {
        Swal.fire(
          "Error!",
          "There was an error deleting your account. Please try again later.",
          "error"
        );
      }
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        Cookies.remove("accessToken");
        window.location.href = "/login";
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-10">
      {/* Header Gradient Area */}
      <div className="relative h-64 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#9B4DFF] to-[#FF6EC7]" />
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* Profile Image */}
        <div className="-mt-24 relative z-10 flex flex-col items-start">
          <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-xl mb-4">
            <img
              src={
                user.profileImage ||
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
              }
              alt={user.fullName}
              className="w-full h-full object-cover"
            />
          </div>

          <h1 className="text-2xl font-bold mb-6">{user.fullName}</h1>

          <div className="flex items-center justify-center gap-12 mb-8 text-center">
            <div>
              <div className="text-xl font-bold">{user.friendsCount || 0}</div>
              <div className="text-gray-400 text-sm">Friends</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <div className="text-xl font-bold">{user.matchedCount || 0}</div>
              <div className="text-gray-400 text-sm">Matched Me</div>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        {galleryImages.length > 0 && (
          <div className="bg-[#1a1a1a] backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/5">
            <h2 className="text-white text-lg font-bold mb-4">Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {galleryImages.map((pic: string, index: number) => (
                <div
                  key={index}
                  className="aspect-[3/4] rounded-xl overflow-hidden hover:scale-105 transition-transform cursor-pointer"
                >
                  <img
                    src={pic}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
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

        {/* Content Sections */}
        <div className="w-full space-y-4">
          {/* About Me */}
          {user.visibleBio && user.bio && (
            <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-white/5">
              <h2 className="text-lg font-bold mb-3">About Me</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                {user.bio}
              </p>
            </section>
          )}

          {/* Personal Information */}
          <section className="bg-[#1a1a1a] rounded-2xl border border-white/5">
            <div className="p-5">
              <h2 className="text-lg font-bold mb-4">Personal Information</h2>

              <div className="space-y-4">
                {user.visibleDob && user.dob && (
                  <>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span className="text-sm">
                        {formatDate(user.dob)} ({calculateAge(user.dob)} years)
                      </span>
                    </div>
                    <div className="h-px bg-white/5" />
                  </>
                )}

                {user.visibleGender && user.gender && (
                  <>
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-500" />
                      <span className="text-sm">{user.gender}</span>
                    </div>
                    <div className="h-px bg-white/5" />
                  </>
                )}

                {user.visibleAddress && user.address && (
                  <>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-500" />
                      <span className="text-sm">{user.address}</span>
                    </div>
                    <div className="h-px bg-white/5" />
                  </>
                )}

                {user.visiblePhoneNumber && user.phoneNumber && (
                  <>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <span className="text-sm">{user.phoneNumber}</span>
                    </div>
                    <div className="h-px bg-white/5" />
                  </>
                )}

                {user.visibleHeight && user.height && (
                  <>
                    <div className="flex items-center gap-3">
                      <Ruler className="w-5 h-5 text-gray-500" />
                      <span className="text-sm">{user.height} cm</span>
                    </div>
                    <div className="h-px bg-white/5" />
                  </>
                )}

                {user.visibleProfession && user.profession && (
                  <>
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-gray-500" />
                      <span className="text-sm">{user.profession}</span>
                    </div>
                    <div className="h-px bg-white/5" />
                  </>
                )}

                {user.visibleLanguages && user.languages && (
                  <>
                    <div className="flex items-center gap-3">
                      <Languages className="w-5 h-5 text-gray-500" />
                      <span className="text-sm">{user.languages}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Interests Section */}
          {interests.length > 0 && (
            <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-white/5">
              <h2 className="text-lg font-bold mb-4">Interests</h2>
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
            </section>
          )}

          {/* Settings / Actions */}
          <section className="bg-[#1a1a1a] rounded-2xl border border-white/5">
            <div className="p-2">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm">
                <Edit2 className="w-5 h-5 text-gray-400" />
                Edit Profile
              </button>

              <div className="h-px bg-white/5 mx-3" />

              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm">
                <Lock className="w-5 h-5 text-gray-400" />
                Change Password
              </button>

              <div className="h-px bg-white/5 mx-3" />

              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm">
                <Shield className="w-5 h-5 text-gray-400" />
                Privacy
              </button>

              <div className="h-px bg-white/5 mx-3" />

              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5" />
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>

              <div className="h-px bg-white/5 mx-3" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm text-red-500"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
