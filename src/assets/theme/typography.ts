import {StyleSheet} from 'react-native';
import {moderateScale} from '@/constants';

const fontWeights = {
	Bold: {
		fontFamily: 'Montserrat-Bold',
	},
	DisplayMedium: {
		fontFamily: 'Montserrat-Medium',
	},
	DisplayRegular: {
		fontFamily: 'Montserrat-Regular',
	},
	Italic: {
		fontFamily: 'Montserrat-Italic',
	},
	Medium: {
		fontFamily: 'Montserrat-Medium',
	},
	Regular: {
		fontFamily: 'Montserrat-Regular',
	},
	SemiBold: {
		fontFamily: 'Montserrat-SemiBold',
	},
};

const fontSizes = {
	f10: {
		fontSize: moderateScale(10),
	},
	f12: {
		fontSize: moderateScale(12),
	},
	f14: {
		fontSize: moderateScale(14),
	},
	f16: {
		fontSize: moderateScale(16),
	},
	f18: {
		fontSize: moderateScale(18),
	},
	f20: {
		fontSize: moderateScale(20),
	},
	f22: {
		fontSize: moderateScale(22),
	},
	f24: {
		fontSize: moderateScale(24),
	},
	f26: {
		fontSize: moderateScale(26),
	},
	f28: {
		fontSize: moderateScale(28),
	},
	f30: {
		fontSize: moderateScale(30),
	},
	f32: {
		fontSize: moderateScale(32),
	},
	f34: {
		fontSize: moderateScale(34),
	},
	f35: {
		fontSize: moderateScale(35),
	},
	f36: {
		fontSize: moderateScale(36),
	},
	f40: {
		fontSize: moderateScale(40),
	},
	f46: {
		fontSize: moderateScale(46),
	},
	f56: {
		fontSize: moderateScale(56),
	},
};

const presets = StyleSheet.create({
	subtitleGray: {
		...fontWeights.Regular,
		...fontSizes.f14,
		color: '#666',
	},
	titleCenter: {
		...fontWeights.SemiBold,
		...fontSizes.f20,
		textAlign: 'center',
	},
});

const typography = {fontSizes,fontWeights,presets};

export default typography;
