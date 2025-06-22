import {useEffect} from "react";
import {Image,StatusBar,StyleSheet,Text,View} from "react-native";
import {MotiView} from "moti";

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
				navigation.navigate(Paths.TabBarNavigation);
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

			{/* Animated logo text */}
			<MotiView
				animate={{opacity: 1,scale: 1}}
				from={{opacity: 0,scale: 0.9}}
				transition={{duration: 800,type: 'timing'}}
			>
				<Text style={[styles.text,{color: theme.textPrimary}]}>
					SPHERE
				</Text>
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
