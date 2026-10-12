import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface OnboardingData {
  profilePhotos: {
    profileImage: File | null;
    galleryImages: File[];
  };
  profileInfo: {
    fullName: { value: string; visible: boolean };
    gender: { value: string; visible: boolean };
    location: { value: string; visible: boolean };
    education: { value: string; visible: boolean };
    religiousBeliefs: { value: string; visible: boolean };
    profession: { value: string; visible: boolean };
    politics: { value: string; visible: boolean };
    languageSpoken: { value: string; visible: boolean };
    datingIntentions: { value: string; visible: boolean };
    height: { value: string; visible: boolean };
    ethnicity: { value: string; visible: boolean };
    children: { value: string; visible: boolean };
    familyPlans: { value: string; visible: boolean };
     dob: { value: string; visible: boolean }; // ISO format string
    vices: { 
      value: {
        Alcohol: string;
        Smoking: string;
        Marijuana: string;
        Drugs: string;
      }; 
      visible: boolean;
    };
    bio: { value: string; visible: boolean };
  };
  datingPreferences: {
    interestedIn: { value: string; visible: boolean };
    preferredMinAge: { value: number; visible: boolean };
    preferredMaxAge: { value: number; visible: boolean };
  };
  relationship: {
    relationshipType: { value: string[]; visible: boolean };
  };
  religion: {
    religiousPreferences: { value: string[]; visible: boolean };
    isDealbreaker: boolean;
  };
  ethnicity: {
    ethnicPreferences: { value: string[]; visible: boolean };
    isDealbreaker: boolean;
  };
  interests: {
    selectedInterests: { value: string[]; visible: boolean };
  };
}

const initialState: OnboardingData = {
  profilePhotos: {
    profileImage: null,
    galleryImages: [],
  },
  profileInfo: {
    fullName: { value: "", visible: true },
    gender: { value: "", visible: true },
    location: { value: "", visible: true },
    education: { value: "", visible: true },
    religiousBeliefs: { value: "", visible: true },
    profession: { value: "", visible: true },
    politics: { value: "", visible: true },
    languageSpoken: { value: "", visible: true },
    datingIntentions: { value: "", visible: true },
    height: { value: "", visible: true },
    ethnicity: { value: "", visible: true },
    children: { value: "", visible: true },
    familyPlans: { value: "", visible: true },
    dob: { value: "", visible: true },
    vices: { 
      value: {
        Alcohol: "No",
        Smoking: "No",
        Marijuana: "No",
        Drugs: "No"
      }, 
      visible: true 
    },
    bio: { value: "", visible: true },
  },
  datingPreferences: {
    interestedIn: { value: "", visible: true },
    preferredMinAge: { value: 18, visible: true },
    preferredMaxAge: { value: 70, visible: true },
  },
  relationship: {
    relationshipType: { value: [], visible: true },
  },
  religion: {
    religiousPreferences: { value: [], visible: true },
    isDealbreaker: false,
  },
  ethnicity: {
    ethnicPreferences: { value: [], visible: true },
    isDealbreaker: false,
  },
  interests: {
    selectedInterests: { value: [], visible: true },
  },
};

// Helper type for profile info fields
type ProfileInfoField = keyof OnboardingData["profileInfo"];
type ProfileInfoValue = string | {
  Alcohol: string;
  Smoking: string;
  Marijuana: string;
  Drugs: string;
};

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    setProfilePhotos: (
      state,
      action: PayloadAction<{
        profileImage: File | null;
        galleryImages: File[];
      }>
    ) => {
      state.profilePhotos = action.payload;
    },
    
    setProfileInfo: (
      state,
      action: PayloadAction<{
        field: ProfileInfoField;
        value: ProfileInfoValue;
        visible: boolean;
      }>
    ) => {
      const { field, value, visible } = action.payload;
      
      if (field === "vices") {
        // Handle vices specifically with proper typing
        state.profileInfo.vices = {
          value: value as {
            Alcohol: string;
            Smoking: string;
            Marijuana: string;
            Drugs: string;
          },
          visible,
        };
      } else {
        // Handle all other string fields
        state.profileInfo[field] = {
          value: value as string,
          visible,
        };
      }
    },
    
    // Specialized action for updating individual vice
    updateVice: (
      state,
      action: PayloadAction<{
        viceName: keyof OnboardingData["profileInfo"]["vices"]["value"];
        value: string;
      }>
    ) => {
      const { viceName, value } = action.payload;
      state.profileInfo.vices.value[viceName] = value;
    },
    
    // Specialized action for updating all vices at once
    updateAllVices: (
      state,
      action: PayloadAction<{
        vices: {
          Alcohol: string;
          Smoking: string;
          Marijuana: string;
          Drugs: string;
        };
        visible?: boolean;
      }>
    ) => {
      state.profileInfo.vices.value = action.payload.vices;
      if (action.payload.visible !== undefined) {
        state.profileInfo.vices.visible = action.payload.visible;
      }
    },
    
    setDatingPreferences: (
      state,
      action: PayloadAction<{
        field: keyof OnboardingData["datingPreferences"];
        value: string | number;
        visible: boolean;
      }>
    ) => {
      const { field, value, visible } = action.payload;
      
      // Use type assertion to handle both string and number values
      if (field === "interestedIn") {
        state.datingPreferences[field] = {
          value: value as string,
          visible,
        };
      } else if (field === "preferredMinAge" || field === "preferredMaxAge") {
        state.datingPreferences[field] = {
          value: value as number,
          visible,
        };
      }
    },
    
    setRelationshipType: (
      state,
      action: PayloadAction<{
        value: string[];
        visible: boolean;
      }>
    ) => {
      state.relationship.relationshipType = action.payload;
    },
    
    setReligionPreferences: (
      state,
      action: PayloadAction<{
        value: string[];
        visible: boolean;
        isDealbreaker: boolean;
      }>
    ) => {
      state.religion.religiousPreferences = {
        value: action.payload.value,
        visible: action.payload.visible,
      };
      state.religion.isDealbreaker = action.payload.isDealbreaker;
    },
    
    setEthnicityPreferences: (
      state,
      action: PayloadAction<{
        value: string[];
        visible: boolean;
        isDealbreaker: boolean;
      }>
    ) => {
      state.ethnicity.ethnicPreferences = {
        value: action.payload.value,
        visible: action.payload.visible,
      };
      state.ethnicity.isDealbreaker = action.payload.isDealbreaker;
    },
    
    setInterests: (
      state,
      action: PayloadAction<{
        value: string[];
        visible: boolean;
      }>
    ) => {
      state.interests.selectedInterests = action.payload;
    },
    
    // Add individual item to arrays
    addReligionPreference: (
      state,
      action: PayloadAction<{
        value: string;
        visible?: boolean;
      }>
    ) => {
      const { value, visible } = action.payload;
      if (!state.religion.religiousPreferences.value.includes(value)) {
        state.religion.religiousPreferences.value.push(value);
      }
      if (visible !== undefined) {
        state.religion.religiousPreferences.visible = visible;
      }
    },
    
    removeReligionPreference: (
      state,
      action: PayloadAction<{
        value: string;
      }>
    ) => {
      state.religion.religiousPreferences.value = 
        state.religion.religiousPreferences.value.filter(item => item !== action.payload.value);
    },
    
    addEthnicityPreference: (
      state,
      action: PayloadAction<{
        value: string;
        visible?: boolean;
      }>
    ) => {
      const { value, visible } = action.payload;
      if (!state.ethnicity.ethnicPreferences.value.includes(value)) {
        state.ethnicity.ethnicPreferences.value.push(value);
      }
      if (visible !== undefined) {
        state.ethnicity.ethnicPreferences.visible = visible;
      }
    },
    
    removeEthnicityPreference: (
      state,
      action: PayloadAction<{
        value: string;
      }>
    ) => {
      state.ethnicity.ethnicPreferences.value = 
        state.ethnicity.ethnicPreferences.value.filter(item => item !== action.payload.value);
    },
    
    addInterest: (
      state,
      action: PayloadAction<{
        value: string;
        visible?: boolean;
      }>
    ) => {
      const { value, visible } = action.payload;
      if (!state.interests.selectedInterests.value.includes(value)) {
        state.interests.selectedInterests.value.push(value);
      }
      if (visible !== undefined) {
        state.interests.selectedInterests.visible = visible;
      }
    },
    
    removeInterest: (
      state,
      action: PayloadAction<{
        value: string;
      }>
    ) => {
      state.interests.selectedInterests.value = 
        state.interests.selectedInterests.value.filter(item => item !== action.payload.value);
    },
    
    // Toggle dealbreakers
    toggleReligionDealbreaker: (state) => {
      state.religion.isDealbreaker = !state.religion.isDealbreaker;
    },
    
    toggleEthnicityDealbreaker: (state) => {
      state.ethnicity.isDealbreaker = !state.ethnicity.isDealbreaker;
    },
    
    // Batch update actions
    updateProfileInfoBatch: (
      state,
      action: PayloadAction<Array<{
        field: ProfileInfoField;
        value: ProfileInfoValue;
        visible: boolean;
      }>>
    ) => {
      action.payload.forEach(({ field, value, visible }) => {
        if (field === "vices") {
          state.profileInfo.vices = {
            value: value as {
              Alcohol: string;
              Smoking: string;
              Marijuana: string;
              Drugs: string;
            },
            visible,
          };
        } else {
          state.profileInfo[field] = {
            value: value as string,
            visible,
          };
        }
      });
    },
    
    // Reset specific sections
    resetProfileInfo: (state) => {
      state.profileInfo = initialState.profileInfo;
    },
    
    resetDatingPreferences: (state) => {
      state.datingPreferences = initialState.datingPreferences;
    },
    
    resetRelationship: (state) => {
      state.relationship = initialState.relationship;
    },
    
    resetReligion: (state) => {
      state.religion = initialState.religion;
    },
    
    resetEthnicity: (state) => {
      state.ethnicity = initialState.ethnicity;
    },
    
    resetInterests: (state) => {
      state.interests = initialState.interests;
    },
    
    resetProfilePhotos: (state) => {
      state.profilePhotos = initialState.profilePhotos;
    },
    
    // Full reset
    resetOnboardingData: () => initialState,
  },
});

export const {
  setProfilePhotos,
  setProfileInfo,
  updateVice,
  updateAllVices,
  setDatingPreferences,
  setRelationshipType,
  setReligionPreferences,
  setEthnicityPreferences,
  setInterests,
  addReligionPreference,
  removeReligionPreference,
  addEthnicityPreference,
  removeEthnicityPreference,
  addInterest,
  removeInterest,
  toggleReligionDealbreaker,
  toggleEthnicityDealbreaker,
  updateProfileInfoBatch,
  resetProfileInfo,
  resetDatingPreferences,
  resetRelationship,
  resetReligion,
  resetEthnicity,
  resetInterests,
  resetProfilePhotos,
  resetOnboardingData,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;