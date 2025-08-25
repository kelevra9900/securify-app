export const enum Paths {
	ActiveRound = 'activeRound',
	Chat = 'chat',
	ChatDetail = 'chatDetail',
	CreateReport = 'createReport',
	Documents = 'documents',
	FaceCamera = 'faceCamera',
	Home = 'home',
	Login = 'login',
	PreviewRound = 'previewRound',
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