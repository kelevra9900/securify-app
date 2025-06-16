import React from 'react';
import {Text} from 'react-native';
import type {TextProps} from 'react-native';

import Typography from '@/assets/theme/typography';
import {colors} from '@/assets/theme/colors';


type TextLabelType = {
	accessibilityLabel?: string;
	align?: 'center' | 'left' | 'right';
	children: React.ReactNode;
	color?: string;
	numberOfLines?: number;
	onPress?: () => void;
	style?: object;
	testID?: string;
	type: string;
} & TextProps;

const TextLabel = ({align = 'left',children,color = '',style = {},type,...props}: TextLabelType) => {
	const fontWeights = () => {
		switch (type.charAt(0).toUpperCase()) {
			case 'A':
				return Typography.fontWeights.DisplayRegular;
			case 'B':
				return Typography.fontWeights.Bold;
			case 'D':
				return Typography.fontWeights.DisplayMedium;
			case 'I':
				return Typography.fontWeights.Italic;
			case 'M':
				return Typography.fontWeights.Medium;
			case 'R':
				return Typography.fontWeights.Regular;
			case 'S':
				return Typography.fontWeights.SemiBold;
			default:
				return Typography.fontWeights.Regular;
		}
	};

	const fontSize = () => {
		switch (type.slice(1)) {
			case '10':
				return Typography.fontSizes.f10;
			case '12':
				return Typography.fontSizes.f12;
			case '14':
				return Typography.fontSizes.f14;
			case '16':
				return Typography.fontSizes.f16;
			case '18':
				return Typography.fontSizes.f18;
			case '20':
				return Typography.fontSizes.f20;
			case '22':
				return Typography.fontSizes.f22;
			case '24':
				return Typography.fontSizes.f24;
			case '26':
				return Typography.fontSizes.f26;
			case '28':
				return Typography.fontSizes.f28;
			case '30':
				return Typography.fontSizes.f30;
			case '32':
				return Typography.fontSizes.f32;
			case '34':
				return Typography.fontSizes.f34;
			case '35':
				return Typography.fontSizes.f35;
			case '36':
				return Typography.fontSizes.f36;
			case '40':
				return Typography.fontSizes.f40;
			case '46':
				return Typography.fontSizes.f46;
			case '56':
				return Typography.fontSizes.f56;
			default:
				return Typography.fontSizes.f14;
		}
	};

	return (
		<Text
			style={[
				type && {...fontWeights(),...fontSize()},
				{color: color ? color : colors.textColor1},
				align && {textAlign: align},
				style,
			]}
			{...props}>
			{children}
		</Text>
	);
};

export default React.memo(TextLabel);