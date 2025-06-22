import React from 'react';
import {StyleSheet,View} from 'react-native';

type Props = {
	progress: number; // 0 a 100
};

const ProgressBar = ({progress}: Props) => {
	return (
		<View style={styles.container}>
			<View style={[styles.filler,{width: `${progress}%`}]} />
		</View>
	);
};

export default ProgressBar;

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#E0E0E0',
		borderRadius: 8,
		height: 8,
		overflow: 'hidden',
		width: '100%',
	},
	filler: {
		backgroundColor: '#3600E0',
		height: '100%',
	},
});
