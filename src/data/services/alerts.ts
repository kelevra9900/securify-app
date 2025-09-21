// src/data/services/alerts.ts
import type { Asset } from 'react-native-image-picker';

import { API_URL } from '@/utils/constants';

import { instance } from '../instance';

export type CreateAlertInput = {
  description: string;
  environmentId?: number;
  image?: Asset | null;
  latitude?: number;
  longitude?: number;
  title: string;
};

function guessExt(mime?: string) {
  if (!mime) {
    return undefined;
  }
  if (mime.includes('jpeg')) {
    return 'jpg';
  }
  const parts = mime.split('/');
  return parts[1] || undefined;
}

function assetToFile(a: Asset) {
  const uri = a.uri!;
  const name = a.fileName ?? `photo.${guessExt(a.type) ?? 'jpg'}`;
  const type = a.type ?? 'image/jpeg';
  // RN FormData usa { uri, name, type }
  return { name, type, uri } as unknown as Blob;
}

export async function createAlertApi(input: CreateAlertInput, token: string) {
  const fd = new FormData();
  fd.append('title', input.title);
  fd.append('description', input.description);
  if (input.environmentId != null) {
    fd.append('environmentId', String(input.environmentId));
  }
  if (input.latitude != null) {
    fd.append('latitude', String(input.latitude));
  }
  if (input.longitude != null) {
    fd.append('longitude', String(input.longitude));
  }
  if (input.image?.uri) {
    fd.append('image', assetToFile(input.image));
  }

  const { data } = await instance.post(`${API_URL}/mobile/alerts`, {
    data: fd,
    method: 'POST',
  });
  return data;
}

export const getSummaryReports = async () => {
  const { data } = await instance.get('mobile/alerts/summary');
  return data;
};

export const fetchAlertDetail = async (id: number) => {
  const { data } = await instance.get(`mobile/alerts/${id}`);
  return data;
};
