import {Dimensions,Platform,StatusBar} from 'react-native';

export const screenHeight: number = Dimensions.get('window').height - 22;

const iPhoneX = screenHeight === 812 ? true : false;


export const STATUSBAR_HEIGHT =
	Platform.OS === 'ios' ? (iPhoneX ? 44 : 22) : StatusBar.currentHeight;
export const screenWidth = Dimensions.get('window').width;
export const screenFullHeight = Dimensions.get('window').height;
export const isAndroid = Platform.OS === 'ios' ? false : true;

const sampleHeight = 812;
const sampleWidth = 375;


//Get Width of Screen
export function getWidth(value: number) {
	return (value / sampleWidth) * screenWidth;
}

//Get Height of Screen
export function getHeight(value: number) {
	return (value / sampleHeight) * screenHeight;
}
const scale = (size: number) => (screenWidth / sampleWidth) * size;

// Moderate Scale Function
export function moderateScale(size: number,factor = 0.5) {
	return size + (scale(size) - size) * factor;
}