import type {PayloadAction} from '@reduxjs/toolkit';
import {createSlice} from '@reduxjs/toolkit';

const initialState = {
	isAuthenticated: false,
	refreshToken: null as null | string,
	token: null as null | string
}

const authSlice = createSlice({
	initialState,
	name: 'auth',
	reducers: {
		clearCredentials: (state) => {
			state.token = null;
			state.isAuthenticated = false;
			state.refreshToken = null
		},
		setCredentials: (state,action: PayloadAction<{refreshToken: string; token: string,}>) => {
			state.token = action.payload.token;
			state.refreshToken = action.payload.refreshToken;
			state.isAuthenticated = true;
		},
	},
})

export const {clearCredentials,setCredentials} = authSlice.actions;
export default authSlice.reducer;