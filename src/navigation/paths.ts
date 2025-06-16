export const enum Paths {
	Login = 'login',
	Home = 'home',
	Rounds = 'rounds',
	Chat = 'chat',
	Reports = 'reports',
	Profile = 'profile',
	TabBarNavigation = 'tabBarNavigation',
	Tasks = 'tasks',
	Splash = 'splash',
}

export type TabParamList = {
	[Paths.Login]: undefined;
	[Paths.Home]: undefined;
	[Paths.Rounds]: undefined;
	[Paths.Chat]: undefined;
	[Paths.Reports]: undefined;
	[Paths.Profile]: undefined;
}