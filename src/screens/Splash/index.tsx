import {useEffect} from "react";
import {View,Text} from "react-native";

import {Paths} from "@/navigation/paths";
import {RootScreenProps} from "@/navigation/types";

const SplashScreen = ({navigation}: RootScreenProps<Paths.Splash>) => {
	useEffect(() => {
		const timer = setTimeout(() => {
			navigation.navigate(Paths.Login)
		},2000);

		return () => clearTimeout(timer);
	},[]);
	return (
		<View style={{flex: 1,justifyContent: 'center',alignItems: 'center'}}>
			<View>
				<Text>Loading...</Text>
			</View>
		</View>
	)
}

export default SplashScreen;