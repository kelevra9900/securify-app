import React,{useEffect} from 'react';
import {Animated,StyleSheet,TouchableOpacity,View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';

import {Paths} from '../paths';
import type {TabParamList} from '../paths';

import {ChatScreen,HomeScreen,ProfileScreen,ReportsScreen,RoundsScreen} from '@/screens';
import {FileText,Home,Map,MessageSquare,User} from 'lucide-react-native';
import {moderateScale} from '@/constants';
import {CSafeAreaView,PanicFAB,TextLabel} from '@/components/atoms';

import {useTheme} from '@/context/Theme';
import {usePanicFAB} from '@/hooks/UI/usePanicFAB';

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_CONFIG = [
	{component: HomeScreen,icon: Home,label: 'Inicio',name: Paths.Home},
	{component: RoundsScreen,icon: Map,label: 'Rondas',name: Paths.Rounds},
	{component: ChatScreen,icon: MessageSquare,label: 'Chat',name: Paths.Chat},
	{component: ReportsScreen,icon: FileText,label: 'Reportes',name: Paths.Reports},
	{component: ProfileScreen,icon: User,label: 'Perfil',name: Paths.Profile},
];

const CustomTabBar = ({descriptors,navigation,state}: BottomTabBarProps) => {
	const {theme} = useTheme();

	return (
		<View style={[styles.tabBar,{backgroundColor: theme.background,borderTopColor: theme.border}]}>
			{state.routes.map((route,index) => {
				const isFocused = state.index === index;
				const {options} = descriptors[route.key];
				const label = options.tabBarLabel ?? options.title ?? route.name;
				const Icon = TAB_CONFIG.find(tab => tab.name === route.name)?.icon;

				const animation = React.useRef(new Animated.Value(isFocused ? 1 : 0)).current;

				useEffect(() => {
					Animated.timing(animation,{
						duration: 250,
						toValue: isFocused ? 1 : 0,
						useNativeDriver: true,
					}).start();
					// eslint-disable-next-line react-hooks/exhaustive-deps
				},[isFocused]);

				const animatedStyle = {
					opacity: animation,
					transform: [{scaleX: animation}],
				};

				return (
					<TouchableOpacity
						key={route.key}
						onPress={() => {
							const event = navigation.emit({
								canPreventDefault: true,
								target: route.key,
								type: 'tabPress',
							});

							if (!isFocused && !event.defaultPrevented) {
								navigation.navigate(route.name as keyof TabParamList);
							}
						}}
						style={styles.tabButton}
					>
						<Animated.View
							style={[
								styles.animatedTopBorder,
								animatedStyle,
								{backgroundColor: theme.highlight},
							]}
						/>
						{Icon && (
							<Icon
								color={isFocused ? theme.highlight : theme.textSecondary}
								height={24}
								strokeWidth={1.8}
								style={styles.icon}
								width={24}
							/>
						)}
						<TextLabel color={isFocused ? theme.highlight : theme.textSecondary} type="M12">
							{typeof label === 'function'
								? label({children: '',color: isFocused ? theme.highlight : theme.textSecondary,focused: isFocused,position: 'below-icon'})
								: label}
						</TextLabel>
					</TouchableOpacity>
				);
			})}
		</View>
	);
};

export default function TabNavigation() {
	const {theme} = useTheme();
	const {triggerSOS} = usePanicFAB();

	return (
		<CSafeAreaView edges={['bottom']} style={{backgroundColor: theme.background,flex: 1}}>
			<Tab.Navigator screenOptions={{headerShown: false}} tabBar={(props) => <CustomTabBar {...props} />}>
				{TAB_CONFIG.map(tab => (
					<Tab.Screen
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						component={tab.component as any}
						key={tab.name}
						name={tab.name as keyof TabParamList}
					/>
				))}
			</Tab.Navigator>

			<PanicFAB onPress={triggerSOS} />
		</CSafeAreaView>
	);
}

const styles = StyleSheet.create({
	animatedTopBorder: {
		alignSelf: 'center',
		borderRadius: 999,
		height: 3,
		position: 'absolute',
		top: 0,
		width: '60%',
	},
	icon: {
		marginBottom: moderateScale(4),
		marginTop: moderateScale(6),
	},
	tabBar: {
		borderTopWidth: 0.5,
		flexDirection: 'row',
		paddingBottom: moderateScale(10),
		paddingTop: moderateScale(6),
	},
	tabButton: {
		alignItems: 'center',
		flex: 1,
	},
});
