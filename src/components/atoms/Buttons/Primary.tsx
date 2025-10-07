import React from 'react';
import type {ViewStyle} from 'react-native';
import {StyleSheet,Text,TouchableOpacity} from 'react-native';

import {colors} from '@/assets/theme/colors';
import {useTheme} from '@/context/Theme';

type Props = {
	disabled?: boolean;
	label: string;
	loading?: boolean;
	onPress: () => void;
	style?: ViewStyle;
};

const PrimaryButton = ({disabled = false,label,loading = false,onPress,style = {}}: Props) => {
	const {theme} = useTheme();

	const disabledStyles = disabled
		? {
			backgroundColor: theme.border,
			borderColor: `${theme.highlight}33`,
			borderWidth: StyleSheet.hairlineWidth,
			elevation: 0,
			opacity: 0.85,
			shadowOpacity: 0,
		}
		: {backgroundColor: theme.highlight};

	const textColor = disabled ? `${colors.white}BF` : theme.textPrimary;

	return (
		<TouchableOpacity
			disabled={disabled}
			onPress={onPress}
			style={[styles.button,disabledStyles,style]}>
			<Text style={[styles.text,{color: textColor}]}>
				{loading ? 'Cargando...' : label}
			</Text>
		</TouchableOpacity>
	);
};

export default PrimaryButton;

const styles = StyleSheet.create({
	button: {
		borderRadius: 16,
		elevation: 3,
		marginBottom: 12,
		paddingHorizontal: 24,
		paddingVertical: 16,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	text: {
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center',
	},
});
