// src/components/atoms/Header.tsx
import React from 'react';
import {Platform,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '@/context/Theme';

type Props = {
	onBackPress?: () => void;
	rightSlot?: React.ReactNode;
	title: string;
};

const Header = ({onBackPress = undefined,rightSlot = undefined,title}: Props) => {
	const navigation = useNavigation();
	const {theme} = useTheme();

	return (
		<View style={[styles.container,{backgroundColor: theme.background,borderBottomColor: theme.border}]}>
			<TouchableOpacity hitSlop={{bottom: 8,left: 8,right: 8,top: 8}} onPress={onBackPress ?? (() => navigation.goBack())}>
				<ArrowLeft color={theme.textPrimary} size={24} />
			</TouchableOpacity>

			<Text numberOfLines={1} style={[styles.title,{color: theme.textPrimary}]}>
				{title}
			</Text>

			<View style={styles.right}>{rightSlot ?? <View style={{width: 24}} />}</View>
		</View>
	);
};

export default Header;

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		borderBottomWidth: StyleSheet.hairlineWidth,
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingVertical: 12,
		// sombra sutil (Android/iOS)
		...(Platform.OS === 'android'
			? {elevation: 2}
			: {shadowColor: '#000',shadowOffset: {height: 4,width: 0},shadowOpacity: 0.08,shadowRadius: 8}),
	},
	right: {alignItems: 'flex-end',minWidth: 24},
	title: {
		flex: 1,
		fontSize: 18,
		fontWeight: '600',
		marginLeft: 12,
	},
});
