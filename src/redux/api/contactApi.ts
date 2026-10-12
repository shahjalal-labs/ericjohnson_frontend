import baseApi from "./baseApi";

const registerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    contactMail: builder.mutation({
      query: (data) => ({
        url: `/contact`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const { useContactMailMutation } = registerApi;
