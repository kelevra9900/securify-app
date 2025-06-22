import React from 'react';
import {StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {MotiView} from 'moti';
import {moderateScale} from '@/constants';

type Props = {
	onPress: () => void;
};

const PanicFAB = ({onPress}: Props) => {
	return (
		<TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.wrapper}>
			<MotiView
				animate={{opacity: 0,scale: 2}}
				from={{opacity: 1,scale: 1}}
				style={styles.ripple}
				transition={{
					duration: 1500,
					loop: true,
					type: 'timing',
				}}
			/>

			<MotiView
				animate={{opacity: 0,scale: 2.5}}
				from={{opacity: 1,scale: 1}}
				style={[styles.ripple,styles.rippleSecondary]}
				transition={{
					delay: 500,
					duration: 2000,
					loop: true,
					type: 'timing',
				}}
			/>

			<View style={styles.button}>
				<Text style={styles.text}>S.O.S</Text>
			</View>
		</TouchableOpacity>
	);
};

const SIZE = 70;

const styles = StyleSheet.create({
	button: {
		alignItems: 'center',
		backgroundColor: '#FF3B30',
		borderRadius: 999,
		elevation: 8,
		height: SIZE,
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.2,
		shadowRadius: 4,
		width: SIZE,
		zIndex: 2,
	},
	ripple: {
		backgroundColor: 'rgba(255, 59, 48, 0.3)',
		borderRadius: 999,
		height: SIZE,
		position: 'absolute',
		width: SIZE,
		zIndex: 1,
	},
	rippleSecondary: {
		backgroundColor: 'rgba(255, 59, 48, 0.2)',
		height: SIZE,
		width: SIZE,
	},
	text: {
		color: '#fff',
		fontSize: 13,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	wrapper: {
		alignItems: 'center',
		bottom: moderateScale(85),
		height: SIZE * 2,
		justifyContent: 'center',
		position: 'absolute',
		right: moderateScale(5),
		width: SIZE * 2,
		zIndex: 100,
	},
});

export default PanicFAB;
