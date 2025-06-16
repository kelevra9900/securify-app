import {StyleSheet} from 'react-native';
import {colors} from './colors';
import flex from './flex';
import margin from './margin';
import {getHeight,moderateScale} from '@/constants';

// App Common Styles
export default StyleSheet.create({
	capitalizeTextStyle: {
		textTransform: 'capitalize',
	},
	generalTitleText: {
		fontSize: moderateScale(24),
	},
	horizontalLine: {
		height: getHeight(10),
		width: '100%',
	},
	iconStyle: {
		height: moderateScale(24),
		width: moderateScale(24),
	},
	innerContainer: {
		paddingHorizontal: moderateScale(20),
		...margin.mt20,
	},
	mainContainer: {
		backgroundColor: colors.backgroundColor,
		...flex.flex,
	},
	shadowStyle: {
		elevation: 5,
		shadowColor: colors.textColor4,
		shadowOffset: {
			height: 2,
			width: 0,
		},
		shadowOpacity: 0.5,
		shadowRadius: 4,
	},
	underLineText: {
		textDecorationLine: 'underline',
	},
});
