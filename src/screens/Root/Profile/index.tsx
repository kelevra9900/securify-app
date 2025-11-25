import type {NavigationProp} from '@react-navigation/native';
import type {RootStackParamList} from '@/navigation/types';

import {useNavigation} from '@react-navigation/native';
import {
  Bell,
  ChevronRight,
  Clock,
  LogOut,
  Nfc,
  Shield,
  Settings,
  User
} from 'lucide-react-native';
import {MotiView} from 'moti';
import React,{useMemo} from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import {useGetCurrentUser} from '@/hooks/user/current_user';
import {Paths} from '@/navigation/paths';

import {CSafeAreaView,TextLabel} from '@/components/atoms';
import {SkeletonBox,SkeletonCircle} from '@/components/atoms/Skeleton';

import {darkTheme} from '@/assets/theme';
import {useTheme} from '@/context/Theme';

// --- Helpers ---
const AVATAR = 100;
function getInitials(name?: string) {
  if (!name) {
    return '??';
  }
  return name
    .trim()
    .split(/\s+/)
    .slice(0,2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

const ProfileScreen = () => {
  const {
    data: profile,
    isError,
    isFetching,
    isPending,
    refetch,
  } = useGetCurrentUser();
  const {theme} = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const fullName = useMemo(
    () =>
      `${profile?.user.firstName ?? ''} ${profile?.user.lastName ?? ''}`.trim(),
    [profile],
  );

  const options = [
    {icon: User,label: 'Editar perfil',onPress: () => { }},
    {
      icon: Shield,
      label: 'Documentos',
      onPress: () => navigation.navigate(Paths.Documents),
    },
    {
      icon: Clock,
      label: 'Asistencias',
      onPress: () => navigation.navigate(Paths.Attendances),
    },
    {
      icon: Bell,
      label: 'Notificaciones',
      onPress: () => navigation.navigate(Paths.Notifications),
    },
    {
      icon: Settings,
      label: 'Permisos',
      onPress: () => navigation.navigate(Paths.Permissions),
    },
    {
      icon: LogOut,
      label: 'Cerrar sesión',
      onPress: () => {
        navigation.navigate(Paths.FaceCameraLogout);
      },
    },
  ];

  // Valores derivados seguros para no romper si falta dato
  const jobName = profile?.user.jobPosition?.name ?? 'Sin puesto';
  const envName = profile?.environment?.name ?? '—';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shiftName = (profile as any)?.user?.shift?.name as string | undefined; // si aún no lo tienes en el snapshot, será undefined

  return (
    <CSafeAreaView
      edges={['top']}
      style={{backgroundColor: theme.background}}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            colors={[darkTheme.highlight]}
            onRefresh={() => refetch()}
            refreshing={isFetching && !isPending}
            tintColor={darkTheme.highlight}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* CARD SUPERIOR */}
        <MotiView
          animate={{opacity: 1,translateY: 0}}
          from={{opacity: 0,translateY: 20}}
          style={[styles.card,{backgroundColor: theme.cardBackground}]}
          transition={{duration: 400,type: 'timing'}}
        >
          {isPending ? (
            <>
              <SkeletonCircle size={AVATAR} style={{marginBottom: 12}} />
              <SkeletonBox height={24} width={'60%' as const} />
              <View style={{height: 10}} />
              <SkeletonBox height={16} width={140} />
              <View style={{height: 4}} />
              <SkeletonBox height={14} width={180} />
            </>
          ) : (
            <>
              {profile?.user?.image ? (
                <Image
                  source={{uri: profile.user.image}}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    styles.avatarFallback,
                    {borderColor: theme.border},
                  ]}
                >
                  <TextLabel type="B24">{getInitials(fullName)}</TextLabel>
                </View>
              )}

              <TextLabel type="B20">{fullName || 'Usuario'}</TextLabel>
              <TextLabel style={{opacity: 0.7}} type="R14">
                {jobName}
              </TextLabel>

              <TextLabel color="gray" type="R12">
                {envName}
                {shiftName ? ` • ${shiftName}` : ''}
              </TextLabel>
            </>
          )}
        </MotiView>

        {/* LISTA DE OPCIONES */}
        <View style={styles.optionsContainer}>
          {
            profile?.user.role === 'ADMIN' || profile?.user.role === 'SUPER_ADMIN' ? (
              <Pressable
                android_ripple={{color: theme.border}}
                onPress={() => {
                  navigation.navigate(Paths.Control)
                }}
                style={({pressed}) => [
                  styles.optionItem,
                  {backgroundColor: theme.cardBackground},
                  pressed && styles.pressed,
                ]}
              >
                <Nfc color={theme.textPrimary} size={20} />
                <TextLabel style={styles.optionText} type="R16">
                  Control
                </TextLabel>
                <ChevronRight color={theme.textSecondary} size={20} />
              </Pressable>
            ) : null
          }
          {isPending
            ? [0,1,2,3].map((i) => (
              <View
                key={`s-${i}`}
                style={[
                  styles.optionItem,
                  {backgroundColor: theme.cardBackground},
                ]}
              >
                <SkeletonBox height={20} radius={6} width={20} />
                <SkeletonBox height={16} width={'60%' as const} />
                <SkeletonBox height={20} radius={6} width={20} />
              </View>
            ))
            : options.map((item,index) => {
              const Icon = item.icon;
              return (
                <Pressable
                  android_ripple={{color: theme.border}}
                  key={index}
                  onPress={item.onPress}
                  style={({pressed}) => [
                    styles.optionItem,
                    {backgroundColor: theme.cardBackground},
                    pressed && styles.pressed,
                  ]}
                >
                  <Icon color={theme.textPrimary} size={20} />
                  <TextLabel style={styles.optionText} type="R16">
                    {item.label}
                  </TextLabel>
                  <ChevronRight color={theme.textSecondary} size={20} />
                </Pressable>
              );
            })}
        </View>

        {/* Mensaje de error discreto */}
        {isError ? (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <TextLabel type="B16">No pudimos cargar tu perfil</TextLabel>
            <TextLabel style={{opacity: 0.7}} type="R14">
              Desliza hacia abajo para reintentar.
            </TextLabel>
          </View>
        ) : null}
      </ScrollView>
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderRadius: AVATAR / 2,
    height: AVATAR,
    marginBottom: 12,
    width: AVATAR,
  },
  avatarFallback: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    borderRadius: 16,
    elevation: 2,
    marginBottom: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {height: 2,width: 0},
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  container: {padding: 16,paddingBottom: 24},
  errorCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
    marginTop: 12,
    padding: 16,
  },
  optionItem: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  optionsContainer: {gap: 12},
  optionText: {flex: 1},
  pressed: {opacity: 0.9},
});

export default ProfileScreen;
