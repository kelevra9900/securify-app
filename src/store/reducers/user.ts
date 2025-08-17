// src/store/slices/profile.ts
import {createSlice,type PayloadAction} from '@reduxjs/toolkit';
import type {ProfileState,SetFromHomePayload} from '@/types/profile';
import type {HomeData} from '@/types/home';

const initialState: ProfileState = {
	environment: null,
	isLoaded: false,
	lastCheckpoint: null,
	sector: null,
	serverTime: undefined,
	shift: null,
	user: null,
};

const profileSlice = createSlice({
	initialState,
	name: 'profile',
	reducers: {
		clearProfile() {
			return initialState;
		},
		patchProfile(state,action: PayloadAction<Partial<ProfileState>>) {
			Object.assign(state,action.payload);
		},

		setFromHome(state,action: PayloadAction<SetFromHomePayload>) {
			const {data,serverTime} = action.payload;
			state.user = data.user;
			state.environment = data.environment;
			state.shift = data.shift ?? null;
			state.sector = data.sector ?? null;
			state.lastCheckpoint = (data as HomeData).lastCheckpoint ?? null;
			state.serverTime = serverTime;
			state.isLoaded = true;
		},
	},
});

export const {clearProfile,patchProfile,setFromHome} = profileSlice.actions;
export default profileSlice.reducer;
