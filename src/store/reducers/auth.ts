import type {PayloadAction} from '@reduxjs/toolkit';
import {createSlice} from '@reduxjs/toolkit';

const initialState = {
	token: null as string | null,
	isAuthenticated: false,
}

const authSlice = createSlice({
	initialState,
	name: 'auth',
	reducers: {
		clearCredentials: (state) => {
			state.token = null;
			state.isAuthenticated = false;
		},
		setCredentials: (state,action: PayloadAction<{token: string}>) => {
			state.token = action.payload.token;
			state.isAuthenticated = true;
		},
	},
})

export const {clearCredentials,setCredentials} = authSlice.actions;
export default authSlice.reducer;