import React from 'react';
import {StyleSheet,Text} from 'react-native';
import {MotiView} from 'moti';

const PanicFeedback = () => {
	return (
		<MotiView
			animate={{opacity: 1,translateY: 0}}
			exit={{opacity: 0,translateY: 50}}
			from={{opacity: 0,translateY: 50}}
			style={styles.feedback}
		>
			<Text style={styles.text}>¡Mensaje SOS enviado!</Text>
		</MotiView>
	);
};

const styles = StyleSheet.create({
	feedback: {
		alignSelf: 'center',
		backgroundColor: '#FF3B30',
		borderRadius: 12,
		bottom: 150,
		elevation: 5,
		paddingHorizontal: 20,
		paddingVertical: 10,
		position: 'absolute',
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.3,
		shadowRadius: 4,
	},
	text: {
		color: '#fff',
		fontSize: 14,
		fontWeight: 'bold',
	},
});

export default PanicFeedback;