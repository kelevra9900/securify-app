import React from 'react';
import {StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '@/context/Theme';

type Props = {
	title: string;
};

const Header = ({title}: Props) => {
	const navigation = useNavigation();
	const {theme} = useTheme();

	return (
		<View style={[styles.container,{backgroundColor: theme.background}]}>
			<TouchableOpacity onPress={() => navigation.goBack()}>
				<ArrowLeft color={theme.textPrimary} size={24} />
			</TouchableOpacity>
			<Text style={[styles.title,{color: theme.textPrimary}]}>{title}</Text>
			<View style={{width: 24}} /> {/* espacio para balancear */}
		</View>
	);
};

export default Header;

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 16,
	},
	title: {
		fontSize: 18,
		fontWeight: '600',
	},
});
