import type {AxiosRequestConfig} from 'axios';

import {instance} from '../instance';

import type {HomeQuery,HomeResponse} from '@/types/home';

export async function getHome(
	params?: HomeQuery,
	config?: AxiosRequestConfig,
): Promise<HomeResponse> {
	const {data} = await instance.get<HomeResponse>('mobile/home',{
		params,
		...config,
	});

	console.log("Getting data",data)
	return data;
}
