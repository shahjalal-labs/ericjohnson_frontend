import baseApi from "./baseApi";

const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyProfile: builder.query({
      query: () => ({
        url: `/auth/profile`,
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    getUserInfo: builder.query({
      query: (id) => ({
        url: `/users/${id}`,
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    updateProfile: builder.mutation({
      query: (data) => ({
        url: `/auth/set-profile`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    sendContact: builder.mutation({
      query: (data) => ({
        url: `/contact`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    resetPasswordSentOtp: builder.mutation({
      query: (data) => ({
        url: `/auth/send-otp`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    resetPasswordVerifyOtp: builder.mutation({
      query: (data) => ({
        url: `/auth/verify-otp`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    addLocation: builder.mutation({
      query: (data) => ({
        url: `/auth/user-location`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    googleLogin: builder.mutation({
      query: (data) => ({
        url: `/auth/auth-login`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    setupProfile: builder.mutation({
      query: (data) => ({
        url: `/auth/profile`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    resetPassword: builder.mutation({
      query: ({ newPassword, forgetToken }) => ({
        url: `/auth/reset-password`,
        method: "PATCH",
        body: { newPassword },
        headers: {
          Authorization: `${forgetToken}`,
        },
      }),
      invalidatesTags: ["User"],
    }),

    deleteAccount: builder.mutation({
      query: () => ({
        url: `/auth/delete-account`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useGetUserInfoQuery,
  useUpdateProfileMutation,
  useSendContactMutation,
  useResetPasswordSentOtpMutation,
  useResetPasswordVerifyOtpMutation,
  useAddLocationMutation,
  useSetupProfileMutation,
  useResetPasswordMutation,
  useGoogleLoginMutation,
  useDeleteAccountMutation,
} = userApi;
