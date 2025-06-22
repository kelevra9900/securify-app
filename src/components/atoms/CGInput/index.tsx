import React from 'react';
import {StyleSheet,Text,TextInput,View} from 'react-native';
import {useTheme} from '@/context/Theme';

type Props = {
	error?: string;
	label: string;
	onChangeText: (text: string) => void;
	placeholder?: string;
	value: string;
};

const CGInput = ({error = '',label,onChangeText,placeholder = '',value}: Props) => {
	const {theme} = useTheme();

	return (
		<View style={styles.container}>
			<Text style={[styles.label,{color: theme.textPrimary}]}>{label}</Text>
			<TextInput
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor={theme.textSecondary}
				style={[
					styles.input,
					{borderColor: error ? theme.error : theme.border,color: theme.textPrimary},
				]}
				value={value}
			/>
			{!!error && <Text style={[styles.errorText,{color: theme.error}]}>{error}</Text>}
		</View>
	);
};

export default CGInput;

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
	},
	errorText: {
		fontSize: 12,
		marginTop: 4,
	},
	input: {
		borderRadius: 8,
		borderWidth: 1,
		fontSize: 16,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	label: {
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 6,
	},
});
