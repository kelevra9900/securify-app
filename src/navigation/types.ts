import type {StackScreenProps} from '@react-navigation/stack';

import {Paths} from "./paths"

export type RootStackParamList = {
	[Paths.Home]: undefined;
	[Paths.Login]: undefined;
	[Paths.Chat]: undefined;
	[Paths.Profile]: undefined;
	[Paths.Reports]: undefined;
	[Paths.Rounds]: undefined;
	[Paths.TabBarNavigation]: undefined;
	[Paths.Tasks]: undefined;
	[Paths.Splash]: undefined;
}

export type RootScreenProps<
	S extends keyof RootStackParamList = keyof RootStackParamList,
> = StackScreenProps<RootStackParamList,S>;
