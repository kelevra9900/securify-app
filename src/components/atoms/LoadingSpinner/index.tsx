// src/components/atoms/LoadingSpinner.tsx
import {ActivityIndicator,StyleSheet,View} from 'react-native';
import {TextLabel} from '@/components/atoms';
import {useTheme} from '@/context/Theme';

type Props = {
	text?: string;
};

const LoadingSpinner = ({text = ''}: Props) => {
	const {theme} = useTheme();

	return (
		<View style={styles.container}>
			<ActivityIndicator color={theme.highlight} size="large" />
			<TextLabel align="center" style={[styles.text,{color: theme.textPrimary}]} type="B16">
				{text || 'Cargando...'}
			</TextLabel>
		</View>
	);
};

export default LoadingSpinner;

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		gap: 16,
	},
	iconContainer: {
		alignItems: 'center',
		borderRadius: 32,
		height: 64,
		justifyContent: 'center',
		marginBottom: 8,
		width: 64,
	},
	text: {
		fontSize: 16,
	},
});
