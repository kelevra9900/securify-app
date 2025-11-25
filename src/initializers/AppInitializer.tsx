import {storage} from "@/App";
import {setSentryUser} from "@/conf/sentry.conf";
import {getCurrentUser} from "@/data/services/user";
import {requestUserPermission,setupNotificationListeners} from "@/services/firebaseMessaging";
import type {RootState} from "@/store";
import {clearCredentials} from "@/store/reducers/auth";
import {MMKV_KEYS} from "@/utils/storage";
import {useQueryClient} from "@tanstack/react-query";
import {useEffect} from "react";
import {useDispatch,useSelector} from "react-redux";

const AppInitializer = () => {
	const token = useSelector((state: RootState) => state.auth.token);
	const dispatch = useDispatch();
	const queryClient = useQueryClient();

	useEffect(() => {
		setupNotificationListeners();
		if (token) {
			requestUserPermission();
		}
	},[token]);

	useEffect(() => {
		const initSession = async () => {
			if (!token) {return;}

			try {
				const userResponse = await getCurrentUser();
				if (!userResponse.ok) {
					throw new Error('Failed to fetch current user');
				}

				const currentUser = userResponse.data;
				storage.set(MMKV_KEYS.user,JSON.stringify(currentUser));
				queryClient.setQueryData(['me'],currentUser);

				try {
					setSentryUser({user: currentUser.user});
				} catch { }
			} catch {
				storage.delete(MMKV_KEYS.user);
				dispatch(clearCredentials());
			}
		};

		initSession();
	},[token,dispatch,queryClient]);


	return null;
};

export default AppInitializer;
