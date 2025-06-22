import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import TabBarNavigation from './type/Tabbar';
import type {RootStackParamList} from './types';
import {Paths} from './paths';

import {
	ChatDetailScreen,
	CreateReportScreen,
	FaceCameraScreen,
	LoginScreen,
	SplashScreen,
	TasksScreen
} from '@/screens';
import {View} from 'react-native';
import {colors} from '@/assets/theme';
import {ThemeProvider} from '@/context/Theme';


const Stack = createNativeStackNavigator<RootStackParamList>();


function ApplicationNavigator() {
	return (
		<SafeAreaProvider>
			<ThemeProvider>
				<NavigationContainer>
					<View style={{backgroundColor: colors.background,flex: 1}}>
						<Stack.Navigator initialRouteName={Paths.Splash} screenOptions={{headerShown: false}}>
							<Stack.Screen component={SplashScreen} name={Paths.Splash} />
							<Stack.Screen component={LoginScreen} name={Paths.Login} />
							<Stack.Screen component={TabBarNavigation} name={Paths.TabBarNavigation} options={{headerShown: false}} />
							<Stack.Screen component={TasksScreen} name={Paths.Tasks} options={{headerShown: false}} />
							<Stack.Screen component={CreateReportScreen} name={Paths.CreateReport} />
							<Stack.Screen component={ChatDetailScreen} name={Paths.ChatDetail} />
							<Stack.Screen
								component={FaceCameraScreen}
								name={Paths.FaceCamera}
								options={{
									headerShown: false,
									presentation: 'modal',
								}}
							/>
						</Stack.Navigator>
					</View>
				</NavigationContainer>
			</ThemeProvider>

		</SafeAreaProvider>
	)
}

export default ApplicationNavigator;