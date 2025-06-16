import {PrimaryButton,TextLabel} from '@/components/atoms';
import {StyleSheet,Text,TouchableOpacity,View} from 'react-native';

const FaceRecognitionInstructions = ({onCancel,onTakePhoto}: {onCancel: () => void; onTakePhoto: () => void;}) => (
	<View style={{alignItems: 'center'}}>
		<TextLabel align="center" style={{marginBottom: 20}} type="R20">
			Asegúrate de que tu rostro esté bien iluminado y visible dentro del marco.
		</TextLabel>
		<PrimaryButton label="Tomar foto" onPress={onTakePhoto} />
		<TouchableOpacity onPress={onCancel}>
			<Text style={styles.cancel}>Cancelar y volver</Text>
		</TouchableOpacity>
	</View>
);

export default FaceRecognitionInstructions;

const styles = StyleSheet.create({
	cancel: {
		color: '#555',
		marginTop: 10,
		textDecorationLine: 'underline'
	},
});