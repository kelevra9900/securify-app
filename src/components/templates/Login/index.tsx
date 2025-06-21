// src/components/templates/LoginTemplate.tsx
import React from 'react';
import {StyleSheet,View} from 'react-native';
import {useTheme} from '@/context/Theme';

type Props = {
	children: React.ReactNode;
};

const LoginTemplate = ({children}: Props) => {
	const {theme} = useTheme();

	return (
		<View style={[styles.container,{backgroundColor: theme.background}]}>
			{children}
		</View>
	);
};

export default LoginTemplate;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
