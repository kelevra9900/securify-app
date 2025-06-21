import {StyleSheet,View} from 'react-native';
import {CheckCheckIcon} from 'lucide-react-native'

type Props = {
	style?: object;
	type: 'error' | 'success';
};
const IconStatus = ({style = {},type}: Props) => (
	<View style={[styles.icon,style]}>
		{type === 'success' ? (
			<CheckCheckIcon color="#4CAF50" />
		) : (
			<CheckCheckIcon color="#F44336" />
		)}
	</View>
);

export default IconStatus;

const styles = StyleSheet.create({
	icon: {textAlign: 'center'},
});
