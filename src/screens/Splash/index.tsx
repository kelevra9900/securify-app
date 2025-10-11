import {useEffect} from "react";
import {Image,StatusBar,StyleSheet,View} from "react-native";
import {MotiImage,MotiView} from "moti";

import {Paths} from "@/navigation/paths";
import type {RootScreenProps} from "@/navigation/types";
import {useTheme} from "@/context/Theme";
import {getHeight,getWidth} from "@/constants";
import {useSelector} from "react-redux";
import type {RootState} from "@/store";

const IMAGE_WIDTH = 331;
const IMAGE_HEIGHT = 747;

const SplashScreen = ({navigation}: RootScreenProps<Paths.Splash>) => {
	const {theme} = useTheme();
	const session = useSelector((state: RootState) => state.auth);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (session.isAuthenticated) {
				navigation.navigate(Paths.SectorSelector);
			} else {
				navigation.navigate(Paths.Login);
			}
		},2000);

		return () => clearTimeout(timer);
	},[navigation,session.isAuthenticated]);

	return (
		<View style={[styles.container,{backgroundColor: theme.background}]}>
			<StatusBar backgroundColor={theme.background} barStyle="light-content" />

			{/* Top decorative image */}
			<Image
				resizeMode="contain"
				source={require('@/assets/images/curve.png')}
				style={styles.topImage}
			/>

			<MotiView
				animate={{opacity: 1,scale: 1,translateY: -8}}
				from={{opacity: 0,scale: 0.9,translateY: 8}}
				style={styles.logoWrap}
				transition={{
					duration: 1200,
					loop: true,
					repeatReverse: true, // va y viene
					type: 'timing',
				}}
			>
				{/* Rectángulo blanco redondeado detrás */}
				<View style={styles.logoBackground} />

				{/* Logo encima */}
				<Image
					resizeMode="contain"
					source={require('@/assets/images/logo.png')}
					style={styles.logo}
				/>
			</MotiView>

		</View>
	);
};

const styles = StyleSheet.create({
	bottomImage: {
		alignSelf: 'center',
		bottom: 0,
		height: getHeight(12),
		opacity: 0.2,
		position: 'absolute',
		transform: [{rotate: '180deg'}],
		width: getWidth(IMAGE_WIDTH),
		zIndex: 0,
	},
	container: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		position: 'relative',
	},
	logo: {
		height: getWidth(192),
		width: getWidth(192),
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
	logoWrap: {
		alignItems: 'center',
		height: getWidth(220),
		justifyContent: 'center',
		width: getWidth(220),
	},
	text: {
		fontSize: 32,
		fontWeight: 'bold',
		letterSpacing: 1.5,
	},
	topImage: {
		alignSelf: 'center',
		height: getHeight(IMAGE_HEIGHT),
		left: -50,
		opacity: 0.25,
		position: 'absolute',
		top: -10,
		width: getWidth(IMAGE_WIDTH),
		zIndex: 0,
	},
});

export default SplashScreen;
