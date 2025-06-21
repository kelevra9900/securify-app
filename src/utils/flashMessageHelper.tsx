import {hideMessage,showMessage} from 'react-native-flash-message';
import type {TextStyle,ViewStyle} from 'react-native';
import {CheckCircle,Info,XCircle} from 'lucide-react-native';
import {colors} from '@/assets/theme';

type FlashType = 'danger' | 'info' | 'success';

const getBaseStyles = () => ({
	backgroundColor: colors.backgroundDark,
	color: colors.white,
	textStyle: {
		color: colors.white,
		fontSize: 14,
		opacity: 0.8,
	},
	titleStyle: {
		color: colors.white,
		fontSize: 16,
		fontWeight: '700' as TextStyle['fontWeight'],
	},
} satisfies {
	backgroundColor: ViewStyle['backgroundColor'];
	color: TextStyle['color'];
	textStyle: TextStyle;
	titleStyle: TextStyle;
});

const getIcon = (type: FlashType) => {
	const iconProps = {color: colors.white,size: 24};
	switch (type) {
		case 'danger':
			return () => <XCircle {...iconProps} />;
		case 'success':
			return () => <CheckCircle {...iconProps} />;
		case 'info':
		default:
			return () => <Info {...iconProps} />;
	}
};

export const flashSuccess = (message: string,description?: string) =>
	showMessage({
		description,
		icon: getIcon('success'),
		message,
		type: 'success',
		...getBaseStyles(),
	});

export const flashError = (message: string,description?: string) =>
	showMessage({
		description,
		icon: getIcon('danger'),
		message,
		type: 'danger',
		...getBaseStyles(),
	});

export const flashInfo = (message: string,description?: string) =>
	showMessage({
		description,
		icon: getIcon('info'),
		message,
		type: 'info',
		...getBaseStyles(),
	});

export const hideFlash = () => hideMessage();
