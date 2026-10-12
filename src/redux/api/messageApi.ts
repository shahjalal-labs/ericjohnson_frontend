import baseApi from "./baseApi";

const messageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMessages: builder.query({
      query: ({ roomId, page, limit }) => ({
        url: `/messages/${roomId}?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["messages"],
    }),
    generateUrl: builder.mutation({
      query: (data) => ({
        url: `/messages/generate-url`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["messages"],
    }),
  }),
});

export const { useGetMessagesQuery, useGenerateUrlMutation } = messageApi;
