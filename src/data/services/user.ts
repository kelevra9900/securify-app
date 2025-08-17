import type {CurrentUserResponse} from "@/types/user";
import {instance} from "../instance"

export const getCurrentUser = async (): Promise<CurrentUserResponse> => {
	const {data} = await instance.get<CurrentUserResponse>('mobile/user');
	return data;
}