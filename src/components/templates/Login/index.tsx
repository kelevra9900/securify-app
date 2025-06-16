import React from 'react';
import {StyleSheet,ScrollView,KeyboardAvoidingView,Platform} from 'react-native';

type Props = {
	children: React.ReactNode;
};

const LoginTemplate = ({children}: Props) => {
	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
		>
			<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
				{children}
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

export default LoginTemplate;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	content: {
		flexGrow: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
	},
});
