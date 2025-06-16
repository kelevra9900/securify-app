import type {JSX} from 'react';
import React,{useEffect} from 'react';
import {BottomTabBarProps,createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {SvgProps} from 'react-native-svg';

import {Paths,TabParamList} from '../paths';
import {Home,Map,MessageSquare,FileText,User} from 'lucide-react-native';
import {ChatScreen,HomeScreen,ProfileScreen,ReportsScreen,RoundsScreen} from '@/screens';
import {Animated,StyleSheet,TouchableOpacity,View} from 'react-native';
import {colors} from '@/assets/theme/colors';
import {moderateScale} from '@/constants';
import {CSafeAreaView,TextLabel} from '@/components/atoms';

const Tab = createBottomTabNavigator<TabParamList>();

type TabConfigItem = {
	component: any;
	icon: (props: SvgProps) => JSX.Element;
	label: string;
	name: keyof TabParamList;
};

const TAB_CONFIG: TabConfigItem[] = [
	{component: HomeScreen,icon: Home as (props: SvgProps) => JSX.Element,label: 'Inicio',name: Paths.Home},
	{component: RoundsScreen,icon: Map as (props: SvgProps) => JSX.Element,label: 'Rondas',name: Paths.Rounds},
	{component: ChatScreen,icon: MessageSquare as (props: SvgProps) => JSX.Element,label: 'Chat',name: Paths.Chat},
	{component: ReportsScreen,icon: FileText as (props: SvgProps) => JSX.Element,label: 'Reportes',name: Paths.Reports},
	{component: ProfileScreen,icon: User as (props: SvgProps) => JSX.Element,label: 'Perfil',name: Paths.Profile},
];

const CustomTabBar = ({descriptors,navigation,state}: BottomTabBarProps) => {
	return (
		<View style={styles.tabBar}>
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
						{/* Top border con animación */}
						<Animated.View style={[styles.animatedTopBorder,animatedStyle]} />

						{Icon && (
							<Icon color={isFocused ? colors.primaryMain : colors.black} height={24} strokeWidth={1.8} style={styles.icon} width={24} />
						)}

						<TextLabel color={isFocused ? colors.primaryMain : colors.black} type="M12">
							{typeof label === 'function'
								? label({children: '',color: isFocused ? colors.primaryMain : colors.black,focused: isFocused,position: 'below-icon'})
								: label}
						</TextLabel>
					</TouchableOpacity>
				);
			})}
		</View>
	);
};

export default function TabNavigation() {
	return (
		<CSafeAreaView edges={['bottom']} style={{backgroundColor: colors.white,flex: 1}}>
			<Tab.Navigator screenOptions={{headerShown: false}} tabBar={(props) => <CustomTabBar {...props} />}>
				{TAB_CONFIG.map(tab => (
					<Tab.Screen component={tab.component} key={tab.name} name={tab.name} />
				))}
			</Tab.Navigator>
		</CSafeAreaView>
	);
}

const styles = StyleSheet.create({
	activeTabButton: {
		borderTopColor: colors.primaryMain,
		borderTopWidth: 2,
	},
	animatedTopBorder: {
		alignSelf: 'center',
		backgroundColor: colors.primaryMain,
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
		backgroundColor: colors.white,
		borderTopColor: colors.lightGray,
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