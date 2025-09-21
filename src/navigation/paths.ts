export const enum Paths {
  ActiveRound = 'activeRound',
  AlertDetail = 'alertDetail',
  Announcement = 'announcement',
  Attendances = 'attendances',
  Chat = 'chat',
  ChatDetail = 'chatDetail',
  CreateReport = 'createReport',
  Documents = 'documents',
  FaceCamera = 'faceCamera',
  Home = 'home',
  Login = 'login',
  Notifications = 'notifications',
  PreviewRound = 'previewRound',
  Profile = 'profile',
  Reports = 'reports',
  Rounds = 'rounds',
  Splash = 'splash',
  TabBarNavigation = 'tabBarNavigation',
  Tasks = 'tasks',
  Walk = 'walk',
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
