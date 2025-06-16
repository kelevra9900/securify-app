import {TouchableOpacity,Text,StyleSheet} from 'react-native';

const PrimaryButton = ({label,onPress}: {label: string; onPress: () => void}) => (
	<TouchableOpacity style={styles.button} onPress={onPress}>
		<Text style={styles.text}>{label}</Text>
	</TouchableOpacity>
);
export default PrimaryButton;

const styles = StyleSheet.create({
	button: {backgroundColor: '#007AFF',paddingVertical: 12,paddingHorizontal: 24,borderRadius: 8,marginBottom: 10},
	text: {color: '#fff',fontSize: 16,fontWeight: '600',textAlign: 'center'},
});
