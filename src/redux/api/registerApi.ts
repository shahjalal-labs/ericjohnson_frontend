import baseApi from "./baseApi";

const registerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    userRegistration: builder.mutation({
      query: (data) => ({
        url: `/users/create`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    userVerifyOtp: builder.mutation({
      query: (data) => ({
        url: `/users/signup-verification`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    userResendOtp: builder.mutation({
      query: (data) => ({
        url: `/users/otp-resend`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    userLogin: builder.mutation({
      query: (data) => ({
        url: `/auth/login`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    userStore: builder.mutation({
      query: (data) => ({
        url: `/auth/social/login`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useUserRegistrationMutation,
  useUserVerifyOtpMutation,
  useUserResendOtpMutation,
  useUserLoginMutation,
  useUserStoreMutation
} = registerApi;
