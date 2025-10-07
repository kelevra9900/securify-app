import {instance} from "../instance"

export const loginWithCredentials = async ({identifier,password}: {identifier: string,password: string}) => {
	const {data} = await instance.post('auth/login',{
		identifier,
		password
	});

	return data;
}