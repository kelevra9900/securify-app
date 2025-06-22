import React from 'react';
import type {ViewStyle} from 'react-native';
import {StyleSheet,Text,TouchableOpacity} from 'react-native';
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

	return (
		<TouchableOpacity
			disabled={disabled}
			onPress={onPress}
			style={[
				styles.button,
				{backgroundColor: disabled ? theme.disabled : theme.highlight},
				style,
			]}>
			<Text
				style={[
					styles.text,
					{color: disabled ? theme.textSecondary : theme.textPrimary},
				]}>
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
