import React from 'react';
import {StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {MotiView} from 'moti';

const PanicButton = () => {
	return (
		<View style={styles.wrapper}>
			{/* Onda animada exterior */}
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

			<TouchableOpacity
				activeOpacity={0.9}
				onPress={() => {
					console.log('¡Botón de pánico presionado!');
				}}
				style={styles.button}
			>
				<Text style={styles.text}>S.O.S</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	button: {
		alignItems: 'center',
		backgroundColor: '#FF3B30',
		borderRadius: 100,
		elevation: 6,
		height: 160,
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: {height: 4,width: 0},
		shadowOpacity: 0.2,
		shadowRadius: 6,
		width: 160,
		zIndex: 2,
	},
	ripple: {
		backgroundColor: 'rgba(255, 59, 48, 0.3)',
		borderRadius: 100,
		height: 160,
		position: 'absolute',
		width: 160,
		zIndex: 1,
	},
	rippleSecondary: {
		backgroundColor: 'rgba(255, 59, 48, 0.2)',
		height: 160,
		width: 160,
	},
	text: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	wrapper: {
		alignItems: 'center',
		height: 200,
		justifyContent: 'center',
		position: 'relative',
		width: 200,
	},
});

export default PanicButton;
