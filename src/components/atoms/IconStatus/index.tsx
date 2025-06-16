import {Text,StyleSheet} from 'react-native';
import {CheckCheckIcon} from 'lucide-react-native'

const IconStatus = ({type}: {type: 'success' | 'error'}) => (
	<Text style={styles.icon}>
		{type === 'success' ? (
			<CheckCheckIcon color="#4CAF50" />
		) : (
			<CheckCheckIcon color="#F44336" />
		)}
	</Text>
);

export default IconStatus;

const styles = StyleSheet.create({
	icon: {fontSize: 50,marginBottom: 20,textAlign: 'center'},
});
