export const enum Paths {
	Chat = 'chat',
	ChatDetail = 'chatDetail',
	CreateReport = 'createReport',
	FaceCamera = 'faceCamera',
	Home = 'home',
	Login = 'login',
	Profile = 'profile',
	Reports = 'reports',
	Rounds = 'rounds',
	Splash = 'splash',
	TabBarNavigation = 'tabBarNavigation',
	Tasks = 'tasks',
}

export type TabParamList = {
	[Paths.Chat]: undefined;
	[Paths.Home]: undefined;
	[Paths.Login]: undefined;
	[Paths.Profile]: undefined;
	[Paths.Reports]: undefined;
	[Paths.Rounds]: undefined;
	[Paths.Tasks]: undefined;
}