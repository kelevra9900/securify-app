import {PrimaryButton,TextLabel} from '@/components/atoms';
import {View,TouchableOpacity,Text,StyleSheet} from 'react-native';

const FaceRecognitionInstructions = ({onTakePhoto,onCancel}: {onTakePhoto: () => void; onCancel: () => void}) => (
	<View style={{alignItems: 'center'}}>
		<TextLabel type="R20" align="center" style={{marginBottom: 20}}>
			Para verificar tu identidad, por favor toma una foto de tu rostro. Asegúrate de que tu cara esté bien iluminada y visible.Asegúrate de estar bien iluminado y visible
		</TextLabel>
		<PrimaryButton label="Tomar foto" onPress={onTakePhoto} />
		<TouchableOpacity onPress={onCancel}>
			<Text style={styles.cancel}>Cancelar</Text>
		</TouchableOpacity>
	</View>
);

export default FaceRecognitionInstructions;

const styles = StyleSheet.create({
	cancel: {
		color: '#555',
		textDecorationLine: 'underline',
		marginTop: 10
	},
});