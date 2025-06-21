import React,{createContext,useContext,useMemo,useState} from 'react';
import type {ThemeType} from '@/assets/theme/colors';
import {themes} from '@/assets/theme/colors';

type ThemeMode = 'dark' | 'light';

type ThemeContextType = {
	mode: ThemeMode;
	theme: ThemeType;
	toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({children}: {children: React.ReactNode}) => {
	const [mode,setMode] = useState<ThemeMode>('dark');

	const toggleTheme = () => setMode(prev => (prev === 'dark' ? 'light' : 'dark'));

	const value = useMemo(
		() => ({
			mode,
			theme: themes[mode],
			toggleTheme,
		}),
		[mode]
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
};
