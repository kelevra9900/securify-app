import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import TabBarNavigation from './type/Tabbar';
import {RootStackParamList} from './types';
import {Paths} from './paths';

import {
	TasksScreen,
	LoginScreen,
	SplashScreen
} from '@/screens';


const Stack = createNativeStackNavigator<RootStackParamList>();


function ApplicationNavigator() {
	return (
		<SafeAreaProvider>
			<NavigationContainer>
				<Stack.Navigator initialRouteName={Paths.Splash} screenOptions={{headerShown: false}}>
					<Stack.Screen name={Paths.Splash} component={SplashScreen} />
					<Stack.Screen name={Paths.Login} component={LoginScreen} />
					<Stack.Screen component={TabBarNavigation} name={Paths.TabBarNavigation} options={{headerShown: false}} />
					<Stack.Screen name={Paths.Tasks} component={TasksScreen} options={{headerShown: false}} />
				</Stack.Navigator>
			</NavigationContainer>
		</SafeAreaProvider>
	)
}

export default ApplicationNavigator;