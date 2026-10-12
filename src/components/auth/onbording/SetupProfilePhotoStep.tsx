import { useSetupProfileMutation } from "@/redux/api/userApi";
import { ArrowLeft, Camera, User, X } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

interface ImageFile {
  id: string;
  url: string;
  file: File;
}

interface SetupProfilePhotoStepProps {
  onNext: () => void;
  onBack: () => void;
}

const SetupProfilePhotoStep: React.FC<SetupProfilePhotoStepProps> = ({
  onNext,
  onBack,
}) => {
  const [profileImage, setProfileImage] = useState<ImageFile | null>(null);
  const [galleryImages, setGalleryImages] = useState<ImageFile[]>([]);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  const showMessage = (type: "success" | "error" | "warning", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const [uploadImagesFn, { isLoading }] = useSetupProfileMutation();

  const validateImage = (file: File): boolean => {
    if (!file.type.startsWith("image/")) {
      showMessage("error", "You can only upload image files!");
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      showMessage("error", "Image must be smaller than 5MB!");
      return false;
    }
    return true;
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateImage(file)) {
      const imageFile: ImageFile = {
        id: Date.now().toString(),
        url: URL.createObjectURL(file),
        file: file,
      };
      setProfileImage(imageFile);
    }
    e.target.value = "";
  };

  const handleGalleryImagesChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(validateImage);

    const newImages: ImageFile[] = validFiles.map((file) => ({
      id: Date.now().toString() + Math.random(),
      url: URL.createObjectURL(file),
      file: file,
    }));

    setGalleryImages((prev) => [...prev, ...newImages].slice(0, 6));
    e.target.value = "";
  };

  const removeProfileImage = () => {
    if (profileImage) {
      URL.revokeObjectURL(profileImage.url);
      setProfileImage(null);
    }
  };

  const removeGalleryImage = (id: string) => {
    setGalleryImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.url);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleNext = async () => {
    // Validation
    if (!profileImage) {
      showMessage("warning", "Please upload a profile photo");
      return;
    }

    try {
      // Create FormData object
      const formData = new FormData();
      
      // Append profile image with field name "profileImage"
      formData.append("profileImage", profileImage.file);
      
      // Append gallery images with field names galleryImage1, galleryImage2, etc.
      galleryImages.forEach((image, index) => {
        formData.append(`galleryImage${index + 1}`, image.file);
      });
      
      // Log FormData contents (for debugging)
      console.log("Uploading FormData with:");
      console.log("- Profile Image:", profileImage.file.name);
      console.log("- Gallery Images:", galleryImages.map(img => img.file.name));
      
      // Call the mutation with FormData
      const response = await uploadImagesFn(formData).unwrap();
      
      // Handle successful upload
      showMessage("success", "Profile photos uploaded successfully!");
      
      // Call onNext to proceed to next step
      onNext();
      
    } catch (error: any) {
      // Handle upload error
      console.error("Upload failed:", error);
      showMessage(
        "error", 
        error?.data?.message || "Failed to upload images. Please try again."
      );
    }
  };

  return (
    <div className=" flex items-center justify-center p-4">
      {/* Toast Message */}
      {message && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg text-white ${
              message.type === "error"
                ? "bg-red-500"
                : message.type === "warning"
                ? "bg-amber-500"
                : "bg-green-500"
            }`}
          >
            {message.text}
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={onBack}
            className="absolute left-6 top-6 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-center text-2xl font-bold text-gray-900">
            Set Up Profile
          </h1>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 px-6 pb-6">
          <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
            <Camera size={16} className="text-white" />
          </div>
          {[...Array(9)].map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-gray-300" />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pb-8">
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
            Add a photo
          </h2>
          <p className="text-center text-gray-500 text-sm mb-6">
            This helps people recognize you
          </p>

          {/* Profile Photo Upload */}
          <div className="mb-6">
            <input
              type="file"
              id="profile-upload"
              accept="image/*"
              onChange={handleProfileImageChange}
              className="hidden"
            />
            <label htmlFor="profile-upload" className="block cursor-pointer">
              {profileImage ? (
                <div className="relative w-full h-48 rounded-2xl overflow-hidden group">
                  <Image
                    src={profileImage.url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeProfileImage();
                    }}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="w-full h-48 bg-pink-100 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-pink-200 transition-colors">
                  <div className="text-center">
                    <Camera size={40} className="text-pink-500 mx-auto mb-2" />
                    <span className="text-sm text-pink-600 font-medium">
                      Add Profile Photo
                    </span>
                  </div>
                </div>
              )}
            </label>
          </div>

          {/* Gallery Photos Grid */}
          <div className="grid grid-cols-3 gap-3">
            {galleryImages.map((image) => (
              <div
                key={image.id}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group"
              >
                <Image
                  src={image.url}
                  alt="Gallery"
                  className="w-full h-full object-cover"
                  fill
                  sizes="(max-width: 768px) 33vw, 256px"
                />
                <button
                  onClick={() => removeGalleryImage(image.id)}
                  className="absolute top-1 right-1 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {galleryImages.length < 6 && (
              <>
                <input
                  type="file"
                  id="gallery-upload"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryImagesChange}
                  className="hidden"
                />
                <label
                  htmlFor="gallery-upload"
                  className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <User size={32} className="text-gray-400" />
                </label>
              </>
            )}

            {[...Array(Math.max(0, 5 - galleryImages.length))].map((_, i) => (
              <div
                key={`placeholder-${i}`}
                className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center"
              >
                <User size={32} className="text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Next Button */}
        <div className="px-6 pb-8">
          <button
            onClick={handleNext}
            disabled={isLoading}
            className={`w-full bg-primary text-white font-semibold py-4 rounded-full transition-colors text-lg ${
              isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-primary-dark"
            }`}
          >
            {isLoading ? "Uploading..." : "Next"}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px) translateX(-50%);
          }
          to {
            opacity: 1;
            transform: translateY(0) translateX(-50%);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SetupProfilePhotoStep;