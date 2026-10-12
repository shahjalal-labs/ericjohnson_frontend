import baseApi from "./baseApi";

const friendsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyFriends: builder.query({
      query: () => ({
        url: `/friend/my-friends`,
        method: "GET",
      }),
      providesTags: ["friends"],
    }),
    sendFriendRequest: builder.mutation({
      query: (id) => ({
        url: `/friend/send-request/${id}`,
        method: "POST",
      }),
      invalidatesTags: ["friends"],
    }),
  }),
});

export const { useGetMyFriendsQuery, useSendFriendRequestMutation } =
  friendsApi;
