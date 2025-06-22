import type {StackScreenProps} from '@react-navigation/stack';

import type {Paths} from "./paths"

export type RootStackParamList = {
	[Paths.Chat]: undefined;
	[Paths.ChatDetail]: undefined;
	[Paths.CreateReport]: undefined;
	[Paths.FaceCamera]: undefined;
	[Paths.Home]: undefined;
	[Paths.Login]: undefined;
	[Paths.Profile]: undefined;
	[Paths.Reports]: undefined;
	[Paths.Rounds]: undefined;
	[Paths.Splash]: undefined;
	[Paths.TabBarNavigation]: undefined;
	[Paths.Tasks]: undefined;
}

export type RootScreenProps<
	S extends keyof RootStackParamList = keyof RootStackParamList,
> = StackScreenProps<RootStackParamList,S>;
