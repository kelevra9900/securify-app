import { useQuery } from '@tanstack/react-query';

import { getSummaryReports } from '@/data/services/alerts';

export type ApiAlertUser = {
  firstName: null | string;
  id: number;
  image: null | string;
  lastName: null | string;
};

export type ApiRecentAlert = {
  createdAt: string; // ISO
  id: number;
  image: null | string;
  location: { lat: number; lng: number };
  status: 'CREATED' | 'REJECTED' | 'SOLVED';
  title: string;
  updatedAt: string; // ISO
  user: ApiAlertUser;
};

export type ApiSummaryResponse = {
  counters: {
    created: number;
    rejected: number;
    resolved: number;
  };
  recent: ApiRecentAlert[];
};
export const ALERTS_SUMMARY_QK = ['alerts', 'summary'] as const;

export const useSummaryReports = () => {
  return useQuery({
    queryFn: () => getSummaryReports(),
    queryKey: ALERTS_SUMMARY_QK,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });
};
