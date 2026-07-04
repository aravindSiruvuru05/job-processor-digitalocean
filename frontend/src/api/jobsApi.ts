import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { CreateJobRequest, Job } from '../types';

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const jobsApi = createApi({
  reducerPath: 'jobsApi',
  baseQuery: fetchBaseQuery({ baseUrl }),
  tagTypes: ['Jobs'],
  endpoints: (builder) => ({
    getJobs: builder.query<Job[], void>({
      query: () => '/jobs',
      providesTags: ['Jobs'],
    }),
    getJob: builder.query<Job, string>({
      query: (id) => `/jobs/${id}`,
    }),
    createJob: builder.mutation<Job, CreateJobRequest>({
      query: (body) => ({
        url: '/jobs',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Jobs'],
    }),
    retryJob: builder.mutation<Job, string>({
      query: (id) => ({
        url: `/jobs/${id}/retry`,
        method: 'POST',
      }),
      invalidatesTags: ['Jobs'],
    }),
  }),
});

export const {
  useGetJobsQuery,
  useGetJobQuery,
  useCreateJobMutation,
  useRetryJobMutation,
} = jobsApi;
