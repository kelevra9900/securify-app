// src/components/atoms/PrimaryButton.tsx
import React from 'react';
import {StyleSheet,Text,TouchableOpacity} from 'react-native';
import {useTheme} from '@/context/Theme';

type Props = {
	label: string;
	onPress: () => void;
};

const PrimaryButton = ({label,onPress}: Props) => {
	const {theme} = useTheme();

	return (
		<TouchableOpacity onPress={onPress} style={[styles.button,{backgroundColor: theme.highlight}]}>
			<Text style={[styles.text,{color: theme.textPrimary}]}>{label}</Text>
		</TouchableOpacity>
	);
};

export default PrimaryButton;

const styles = StyleSheet.create({
	button: {
		borderRadius: 8,
		marginBottom: 10,
		paddingHorizontal: 24,
		paddingVertical: 12,
	},
	text: {
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center',
	},
});
