import type {SectorPagination,SectorUpdated} from '@/types/sector';
import {instance} from '../instance';

export type GetSectorsParams = {
	page?: number;
	perPage?: number;
};

export async function getSectors(params: GetSectorsParams = {}) {
	const {data} = await instance.get<SectorPagination>(`/mobile/user/sectors?page=${params.page}&limit=${params.perPage ?? 1}`);

	return data;
}

export async function updateMySector(sectorId: number) {
	const {data} = await instance.patch<SectorUpdated>('/mobile/user/sector',{
		sectorId
	});

	return data;
}