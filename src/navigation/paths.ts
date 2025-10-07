export const enum Paths {
  ActiveRound = 'activeRound',
  AlertDetail = 'alertDetail',
  Announcement = 'announcement',
  Attendances = 'attendances',
  Chat = 'chat',
  ChatDetail = 'chatDetail',
  Control = 'control',
  CreateReport = 'createReport',
  Documents = 'documents',
  FaceCamera = 'faceCamera',
  Home = 'home',
  Login = 'login',
  LoginWithCredentials = 'loginWithCredentials',
  Notifications = 'notifications',
  PreviewRound = 'previewRound',
  Profile = 'profile',
  Reports = 'reports',
  Rounds = 'rounds',
  SectorSelector = 'sectorSelector',
  Splash = 'splash',
  TabBarNavigation = 'tabBarNavigation',
  Tasks = 'tasks',
  Walk = 'walk'
}

export type TabParamList = {
  [Paths.Chat]: undefined;
  [Paths.Home]: undefined;
  [Paths.Login]: undefined;
  [Paths.Profile]: undefined;
  [Paths.Reports]: undefined;
  [Paths.Rounds]: undefined;
  [Paths.Tasks]: undefined;
};
