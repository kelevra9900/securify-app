// src/utils/flashMessageHelper.ts
import {hideMessage,showMessage} from 'react-native-flash-message';
import type {TextStyle} from 'react-native';
import {CheckCircle,Info,XCircle} from 'lucide-react-native';
import {colors} from '@/assets/theme';

type FlashType = 'danger' | 'info' | 'success';

const getStyles = (type: FlashType) => {
	const baseBackground = '#1C1C1E';
	const successColor = '#2ECC71';
	const errorColor = '#E74C3C';
	const infoColor = '#3498DB';

	let backgroundColor = baseBackground;

	switch (type) {
		case 'danger':
			backgroundColor = errorColor;
			break;
		case 'info':
			backgroundColor = infoColor;
			break;
		case 'success':
			backgroundColor = successColor;
			break;
	}

	return {
		backgroundColor,
		color: colors.white,
		textStyle: {
			color: colors.white,
			fontSize: 13,
			fontWeight: '400' as TextStyle['fontWeight'],
			marginLeft: 8,
			marginTop: 2,
		},
		titleStyle: {
			color: colors.white,
			fontSize: 15,
			fontWeight: '600' as TextStyle['fontWeight'],
			marginLeft: 8,
		},
	};
};

const getIcon = (type: FlashType) => {
	const iconProps = {color: colors.white,size: 22,strokeWidth: 2};
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
		animated: true,
		autoHide: true,
		description,
		duration: 3000,
		icon: getIcon('success'),
		message,
		position: 'top',
		type: 'success',
		...getStyles('success'),
	});

export const flashError = (message: string,description?: string) =>
	showMessage({
		animated: true,
		autoHide: true,
		description,
		duration: 3500,
		icon: getIcon('danger'),
		message,
		position: 'top',
		type: 'danger',
		...getStyles('danger'),
	});

export const flashInfo = (message: string,description?: string) =>
	showMessage({
		animated: true,
		autoHide: true,
		description,
		duration: 3000,
		icon: getIcon('info'),
		message,
		position: 'top',
		type: 'info',
		...getStyles('info'),
	});

export const hideFlash = () => hideMessage();
