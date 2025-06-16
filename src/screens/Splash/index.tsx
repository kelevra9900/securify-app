import {useEffect} from "react";
import {Text,View} from "react-native";

import {Paths} from "@/navigation/paths";
import type {RootScreenProps} from "@/navigation/types";

const SplashScreen = ({navigation}: RootScreenProps<Paths.Splash>) => {
	useEffect(() => {
		const timer = setTimeout(() => {
			navigation.navigate(Paths.Login)
		},2000);

		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	},[]);

	return (
		<View style={{alignItems: 'center',flex: 1,justifyContent: 'center'}}>
			<View>
				<Text>Loading...</Text>
			</View>
		</View>
	)
}

export default SplashScreen;