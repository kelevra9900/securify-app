import {ActivityIndicator,Text,View,StyleSheet} from 'react-native';

const LoadingSpinner = () => (
	<View style={styles.container}>
		<ActivityIndicator size="large" />
		<Text style={styles.text}>Verificando identidad...</Text>
	</View>
);

export default LoadingSpinner;

const styles = StyleSheet.create({
	container: {alignItems: 'center'},
	text: {marginTop: 10,fontSize: 16},
});
