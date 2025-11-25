
//App colors
export const colors = {
	background: '#F9F7FF',
	backgroundColor: '#FFFFFF',
	backgroundColor2: '#F9F9F9',
	backgroundColor3: '#FAFAFA',
	backgroundColor4: '#FFFFFF20',
	backgroundColor5: '#F3F3F3',
	backgroundColor6: '#EFEFEF',
	backgroundColor7: '#E3E3E3',
	backgroundDark: '#0B0B14',
	black: '#000000',
	blueColor1: '#1F4BDC',
	blueColor2: '#5868E3',
	borderColor1: '#E0E0E0',
	darkPurple: '#070022',
	darkTheme: {
		background: '#1A1A2E',
		border: '#0F3460',
		cardBackground: '#16213E',
		highlight: '#E94560',
		textMuted: '#0F3460',
		textPrimary: '#FFFFFF',
		textSecondary: '#E94560',
	},
	dropShadow: '#B5ADD814',
	errorBackground: '#FAE3E3',
	gray: '#B7B7B7',
	greenColor1: '#5CE27F',
	inActiveColor: '#C3C3C3',
	lightBlue: '#F0F6FE',
	lightGray: '#F5F5F5',
	lightPurple: '#AE92FF',
	lightPurpleBackground: '#F9F7FF',
	lightRed: '#FAE3E3',
	lightTheme: {
		background: '#F9F7FF',
		border: '#E0E0E0',
		cardBackground: '#FFFFFF',
		error: '#E94560',
		highlight: '#0F3460',
		textPrimary: '#141938',
		textSecondary: '#677489',
	},
	link: '#4F12FF',
	orangeColor1: '#FF8050',
	primaryDark: '#1D3C34',
	primaryMain: '#3600E0',
	primaryText: '#141938',
	primaryTransparent1: '#EAECF7',
	purpleBackground: '#AEA5FF',
	redColor1: '#DD524C',
	secondaryBg: '#EAEEFF',
	success: '#5CE27F',
	successBackground: '#E3F9E5',
	successBadge: '#B2E358',
	textBadge: '#030616',
	textBlueLight: '#2442A9',
	textColor1: '#364154',
	textColor2: '#677489',
	textColor3: '#02224D',
	textColor4: '#999999',
	textColor5: '#727272',


	// Text

	subtitle: '#220090',
	titleBoldPrimary: ' #100049',
	titleColor: ' #364154',
	warning: '#F6D466',
	white: '#FFFFFF',
	yellowColor1: '#FECD00',
	yellowColor2: '#F6D466',
	// Yellow light
	yellowLight: '#FFF8E1',

	// Button Colors
	bColor1: '#EDEDED',
	bColor2: '#E8E8E8',
	bColor3: '#E5E5E5',
	bColor4: '#D0D0D0',

	categoriesColor1: '#E6EBF8',
	categoriesColor2: '#FBEFEC',
	categoriesColor3: '#F4F5F8',
	categoriesColor4: '#FFFBEC',
	categoriesColor5: '#53A0EF',

	transparent: 'transparent',
};


export const lightTheme = {
	background: '#F9F7FF',
	border: '#E0E0E0',
	cardBackground: '#FFFFFF',
	disabled: '#ccc',
	error: '#E94560',
	highlight: '#0F3460',
	textPrimary: '#141938',
	textSecondary: '#677489',
};

export const darkTheme = {
	background: '#1A1A2E',
	border: '#2C3E50',
	cardBackground: '#16213E',
	disabled: '#ccc',
	error: '#E94560',
	highlight: '#5C7AEA',
	textPrimary: '#FFFFFF',
	textSecondary: '#B0BEC5',
};


export const themes = {
	dark: darkTheme,
	light: lightTheme,
};

export type ThemeType = typeof lightTheme;
