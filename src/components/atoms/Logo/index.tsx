import React from 'react';
import {Image,StyleSheet,View} from 'react-native';
import {moderateScale} from '@/constants';
import {useTheme} from '@/context/Theme';
import {MotiView} from 'moti';

type Props = {
	animated?: boolean;
};

const Logo = ({animated = false}: Props) => {
	const {theme} = useTheme();

	const LogoWrapper = animated ? MotiView : View;

	return (
		<LogoWrapper
			animate={animated ? {opacity: 1,scale: 1} : undefined}
			from={animated ? {opacity: 0,scale: 0.8} : undefined}
			style={[styles.container,{backgroundColor: theme.cardBackground}]}
			transition={animated ? {duration: 600,type: 'timing'} : undefined}
		>
			<View style={styles.logoBackground} />

			<Image
				resizeMode="contain"
				source={require('@/assets/images/logo.png')}
				style={styles.logo}
			/>
		</LogoWrapper>
	);
};

export default Logo;

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		borderRadius: 12,
		justifyContent: 'center',
		marginBottom: 16,
		paddingHorizontal: 16,
		paddingVertical: 16,
		width: '100%',
	},
	logo: {
		borderRadius: 8,
		height: moderateScale(76,0.3),
		width: moderateScale(90,0.3),
	},
	logoBackground: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: '#FFFFFF',
		borderRadius: 24,
		elevation: 6,
		shadowColor: '#000',
		shadowOffset: {height: 6,width: 0},
		shadowOpacity: 0.12,
		shadowRadius: 10,
	},
});
