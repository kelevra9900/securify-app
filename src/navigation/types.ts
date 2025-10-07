import type {Paths} from './paths';
import type {StackScreenProps} from '@react-navigation/stack';

export type RootStackParamList = {
  [Paths.ActiveRound]: {
    id: number;
  };
  [Paths.AlertDetail]: {
    id: number;
  };
  [Paths.Announcement]: {
    id: number;
  };
  [Paths.Attendances]: undefined;
  [Paths.Chat]: undefined;
  [Paths.ChatDetail]: {
    conversationId: number;
    title: string;
  };
  [Paths.Control]: undefined;
  [Paths.CreateReport]: undefined;
  [Paths.Documents]: undefined;
  [Paths.FaceCamera]: undefined;
  [Paths.Home]: undefined;
  [Paths.Login]: undefined;
  [Paths.LoginWithCredentials]: undefined;
  [Paths.Notifications]: undefined;
  [Paths.PreviewRound]: undefined;
  [Paths.Profile]: undefined;
  [Paths.Reports]: undefined;
  [Paths.Rounds]: undefined;
  [Paths.Rounds]: undefined;
  [Paths.SectorSelector]: undefined;
  [Paths.Splash]: undefined;
  [Paths.TabBarNavigation]: undefined;
  [Paths.Tasks]: undefined;
  [Paths.Walk]: undefined;
};

export type RootScreenProps<
  S extends keyof RootStackParamList = keyof RootStackParamList,
> = StackScreenProps<RootStackParamList,S>;
