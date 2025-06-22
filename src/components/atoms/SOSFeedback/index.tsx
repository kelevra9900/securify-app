// src/components/atoms/SOSFeedback.tsx
import React from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {AnimatePresence,MotiView} from 'moti';

type Props = {
	visible: boolean;
};

const SOSFeedback = ({visible}: Props) => {
	return (
		<AnimatePresence>
			{visible && (
				<MotiView
					animate={{opacity: 1,translateY: 0}}
					exit={{opacity: 0,translateY: 20}}
					from={{opacity: 0,translateY: 20}}
					style={styles.container}
					transition={{duration: 300,type: 'timing'}}
				>
					<View style={styles.box}>
						<Text style={styles.text}>¡Mensaje de emergencia enviado!</Text>
					</View>
				</MotiView>
			)}
		</AnimatePresence>
	);
};

const styles = StyleSheet.create({
	box: {
		backgroundColor: '#FF3B30',
		borderRadius: 20,
		elevation: 4,
		paddingHorizontal: 24,
		paddingVertical: 10,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.1,
	},
	container: {
		alignSelf: 'center',
		bottom: 150,
		position: 'absolute',
		zIndex: 200,
	},
	text: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600',
		textAlign: 'center',
	},
});

export default SOSFeedback;
