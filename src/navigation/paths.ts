export const enum Paths {
  ActiveRound = 'activeRound',
  AlertDetail = 'alertDetail',
  Announcement = 'announcement',
  AnnouncementsList = 'announcementsList',
  Attendances = 'attendances',
  Chat = 'chat',
  ChatDetail = 'chatDetail',
  Control = 'control',
  CreateReport = 'createReport',
  Documents = 'documents',
  FaceCamera = 'faceCamera',
  FaceCameraLogout = 'faceCameraLogout',
  Home = 'home',
  Login = 'login',
  LoginWithCredentials = 'loginWithCredentials',
  Notifications = 'notifications',
  Permissions = 'permissions',
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
