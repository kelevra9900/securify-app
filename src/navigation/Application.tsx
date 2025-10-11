import type {RootStackParamList} from './types';

import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {
  ActiveRound,
  AlertDetailScreen,
  AnnouncementScreen,
  AnnouncementsListScreen,
  AttendancesScreen,
  ChatDetailScreen,
  ControlScreen,
  CreateReportScreen,
  DocumentsScreen,
  FaceCameraScreen,
  ListRounds,
  LoginScreen,
  LoginWithCredentials,
  LogoutScreen,
  NotificationsScreen,
  PreviewRound,
  RoundWalkScreen,
  SectorSelector,
  SplashScreen,
  TasksScreen
} from '@/screens';

import {colors} from '@/assets/theme';
import {ThemeProvider} from '@/context/Theme';

import {Paths} from './paths';
import TabBarNavigation from './type/Tabbar';

const Stack = createNativeStackNavigator<RootStackParamList>();

function ApplicationNavigator() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <View style={{backgroundColor: colors.background,flex: 1}}>
            <Stack.Navigator
              initialRouteName={Paths.Splash}
              screenOptions={{headerShown: false}}
            >
              <Stack.Screen component={SplashScreen} name={Paths.Splash} />
              <Stack.Screen component={AnnouncementsListScreen} name={Paths.AnnouncementsList} />
              <Stack.Screen component={LoginScreen} name={Paths.Login} />
              <Stack.Screen component={SectorSelector} name={Paths.SectorSelector} />
              <Stack.Screen component={ControlScreen} name={Paths.Control} />
              <Stack.Screen component={LoginWithCredentials} name={Paths.LoginWithCredentials} />
              <Stack.Screen component={LogoutScreen} name={Paths.FaceCameraLogout} />
              <Stack.Screen
                component={TabBarNavigation}
                name={Paths.TabBarNavigation}
                options={{headerShown: false}}
              />
              <Stack.Screen
                component={TasksScreen}
                name={Paths.Tasks}
                options={{headerShown: false}}
              />
              <Stack.Screen
                component={CreateReportScreen}
                name={Paths.CreateReport}
              />
              <Stack.Screen
                component={ChatDetailScreen}
                name={Paths.ChatDetail}
              />
              <Stack.Screen
                component={DocumentsScreen}
                name={Paths.Documents}
              />
              <Stack.Screen
                component={NotificationsScreen}
                name={Paths.Notifications}
              />
              <Stack.Screen
                component={AttendancesScreen}
                name={Paths.Attendances}
              />
              <Stack.Screen component={ListRounds} name={Paths.Rounds} />
              <Stack.Screen component={RoundWalkScreen} name={Paths.Walk} />
              <Stack.Screen component={ActiveRound} name={Paths.ActiveRound} />
              <Stack.Screen
                component={PreviewRound}
                name={Paths.PreviewRound}
              />
              <Stack.Screen
                component={AlertDetailScreen}
                name={Paths.AlertDetail}
              />
              <Stack.Screen
                component={AnnouncementScreen}
                name={Paths.Announcement}
              />
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
  );
}

export default ApplicationNavigator;
