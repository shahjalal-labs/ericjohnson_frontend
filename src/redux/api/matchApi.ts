import baseApi from "./baseApi";

const registerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllMatches: builder.query({
      query: () => ({
        url: `/match/matching-users`,
        method: "GET",
      }),
      providesTags: ["matches"],
    }),
  }),
});

export const { useGetAllMatchesQuery } = registerApi;
