import {ActivityIndicator,StyleSheet,View} from 'react-native';
import {Search} from 'lucide-react-native'
import {TextLabel} from '@/components/atoms'

const LoadingSpinner = () => (
	<View style={styles.container}>
		<ActivityIndicator size="large" />
		<TextLabel align="center" style={styles.text} type="R16">
			<Search color="#007AFF" size={24} />
		</TextLabel>
	</View>
);

export default LoadingSpinner;

const styles = StyleSheet.create({
	container: {alignItems: 'center'},
	text: {fontSize: 16,marginTop: 10},
});
