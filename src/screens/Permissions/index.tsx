import type {NavigationProp} from '@react-navigation/native';
import type {RootStackParamList} from '@/navigation/types';

import {useNavigation} from '@react-navigation/native';
import {
  Battery,
  Bell,
  Camera,
  CheckCircle2,
  MapPin,
  Nfc,
  RefreshCw,
  Settings,
  XCircle,
} from 'lucide-react-native';
import {MotiView} from 'moti';
import React, {useCallback} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {checkNotifications, openSettings, requestNotifications, RESULTS} from 'react-native-permissions';
import {PermissionsAndroid} from 'react-native';

import {CSafeAreaView, Header, TextLabel} from '@/components/atoms';
import {usePermissions, type PermissionInfo} from '@/hooks/permissions/usePermissions';
import {useTheme} from '@/context/Theme';
import {NativeModules} from 'react-native';

const MODULE_NAME = 'TrackingModule';

type TrackingModuleSpec = {
  isIgnoringBatteryOptimizations?: () => Promise<boolean>;
  openBatteryOptimizationSettings?: () => void;
  requestIgnoreBatteryOptimizations?: () => void;
};

function getTrackingModule(): TrackingModuleSpec {
  const mod = (NativeModules as Record<string, unknown>)[MODULE_NAME] as
    | TrackingModuleSpec
    | undefined;
  return mod || {};
}

const PermissionScreen = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {permissions, isLoading, refresh} = usePermissions();

  const getPermissionIcon = (id: string) => {
    switch (id) {
      case 'notifications':
        return Bell;
      case 'location_foreground':
      case 'location_background':
        return MapPin;
      case 'battery_optimization':
        return Battery;
      case 'nfc':
        return Nfc;
      case 'camera':
        return Camera;
      default:
        return Settings;
    }
  };

  const getStatusIcon = (status: PermissionInfo['status']) => {
    switch (status) {
      case 'granted':
        return CheckCircle2;
      case 'denied':
        return XCircle;
      case 'unavailable':
        return XCircle;
      default:
        return null;
    }
  };

  const getStatusColor = (status: PermissionInfo['status']) => {
    switch (status) {
      case 'granted':
        return '#5CE27F';
      case 'denied':
        return '#DD524C';
      case 'unavailable':
        return '#B7B7B7';
      default:
        return theme.textSecondary;
    }
  };

  const handleRequestPermission = useCallback(
    async (permission: PermissionInfo) => {
      try {
        if (permission.onRequest) {
          await permission.onRequest();
          refresh();
          return;
        }

        switch (permission.id) {
          case 'notifications': {
            const {status} = await requestNotifications(['alert', 'badge', 'sound']);
            if (status === RESULTS.BLOCKED) {
              Alert.alert(
                'Permiso bloqueado',
                'Por favor, habilita las notificaciones desde Configuración.',
                [
                  {text: 'Cancelar', style: 'cancel'},
                  {
                    text: 'Abrir configuración',
                    onPress: () => openSettings('notifications'),
                  },
                ],
              );
            }
            refresh();
            break;
          }
          case 'location_foreground': {
            if (Platform.OS === 'android') {
              const fine = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              );
              if (fine === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
                Alert.alert(
                  'Permiso bloqueado',
                  'Por favor, habilita la ubicación desde Configuración.',
                  [
                    {text: 'Cancelar', style: 'cancel'},
                    {
                      text: 'Abrir configuración',
                      onPress: () => Linking.openSettings(),
                    },
                  ],
                );
              }
              refresh();
            }
            break;
          }
          case 'location_background': {
            if (Platform.OS === 'android' && Platform.Version >= 29) {
              const background = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
              );
              if (background === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
                Alert.alert(
                  'Permiso bloqueado',
                  'Por favor, habilita la ubicación en segundo plano desde Configuración.',
                  [
                    {text: 'Cancelar', style: 'cancel'},
                    {
                      text: 'Abrir configuración',
                      onPress: () => Linking.openSettings(),
                    },
                  ],
                );
              }
              refresh();
            }
            break;
          }
          case 'battery_optimization': {
            const mod = getTrackingModule();
            mod.requestIgnoreBatteryOptimizations?.();
            refresh();
            break;
          }
          case 'camera': {
            if (Platform.OS === 'android') {
              const camera = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
              );
              if (camera === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
                Alert.alert(
                  'Permiso bloqueado',
                  'Por favor, habilita la cámara desde Configuración.',
                  [
                    {text: 'Cancelar', style: 'cancel'},
                    {
                      text: 'Abrir configuración',
                      onPress: () => Linking.openSettings(),
                    },
                  ],
                );
              }
              refresh();
            }
            break;
          }
        }
      } catch (error) {
        console.error('Error requesting permission:', error);
        Alert.alert('Error', 'No se pudo solicitar el permiso. Intenta nuevamente.');
      }
    },
    [refresh],
  );

  const handleOpenSettings = useCallback((permission: PermissionInfo) => {
    if (permission.id === 'battery_optimization') {
      const mod = getTrackingModule();
      mod.openBatteryOptimizationSettings?.();
    } else {
      Linking.openSettings();
    }
  }, []);

  const renderPermissionItem = (permission: PermissionInfo, index: number) => {
    const Icon = getPermissionIcon(permission.id);
    const StatusIcon = getStatusIcon(permission.status);
    const statusColor = getStatusColor(permission.status);

    return (
      <MotiView
        key={permission.id}
        animate={{opacity: 1, translateY: 0}}
        from={{opacity: 0, translateY: 20}}
        style={[
          styles.permissionCard,
          {backgroundColor: theme.cardBackground, borderColor: theme.border},
        ]}
        transition={{
          delay: index * 50,
          duration: 300,
          type: 'timing',
        }}
      >
        <View style={styles.permissionHeader}>
          <View style={[styles.iconContainer, {backgroundColor: `${statusColor}15`}]}>
            <Icon color={statusColor} size={24} />
          </View>
          <View style={styles.permissionInfo}>
            <TextLabel type="B16" color={theme.textPrimary}>
              {permission.label}
            </TextLabel>
            <TextLabel
              type="R13"
              color={theme.textSecondary}
              style={styles.description}
            >
              {permission.description}
            </TextLabel>
          </View>
          {StatusIcon && (
            <StatusIcon color={statusColor} size={24} style={styles.statusIcon} />
          )}
          {permission.status === 'checking' && (
            <ActivityIndicator
              color={theme.textSecondary}
              size="small"
              style={styles.statusIcon}
            />
          )}
        </View>

        {permission.status !== 'granted' && permission.status !== 'unavailable' && (
          <View style={styles.actionContainer}>
            {permission.canRequest ? (
              <Pressable
                android_ripple={{color: theme.border}}
                onPress={() => handleRequestPermission(permission)}
                style={({pressed}) => [
                  styles.actionButton,
                  {backgroundColor: theme.primaryMain},
                  pressed && styles.pressed,
                ]}
              >
                <TextLabel type="R14" color={theme.white}>
                  Solicitar permiso
                </TextLabel>
              </Pressable>
            ) : (
              <Pressable
                android_ripple={{color: theme.border}}
                onPress={() => handleOpenSettings(permission)}
                style={({pressed}) => [
                  styles.actionButton,
                  {backgroundColor: theme.textSecondary},
                  pressed && styles.pressed,
                ]}
              >
                <TextLabel type="R14" color={theme.white}>
                  Abrir configuración
                </TextLabel>
              </Pressable>
            )}
          </View>
        )}

        {permission.status === 'unavailable' && (
          <View style={styles.unavailableContainer}>
            <TextLabel type="R12" color={theme.textSecondary}>
              No disponible en este dispositivo
            </TextLabel>
          </View>
        )}
      </MotiView>
    );
  };

  return (
    <CSafeAreaView edges={['top']} style={{backgroundColor: theme.background}}>
      <Header title="Permisos" />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.textSecondary} size="large" />
          <TextLabel type="R14" color={theme.textSecondary} style={styles.loadingText}>
            Verificando permisos...
          </TextLabel>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl
              colors={[theme.textSecondary]}
              onRefresh={refresh}
              refreshing={isLoading}
              tintColor={theme.textSecondary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerInfo}>
            <TextLabel type="R14" color={theme.textSecondary}>
              Gestiona los permisos de la aplicación para asegurar el correcto
              funcionamiento de todas las funcionalidades.
            </TextLabel>
          </View>

          <View style={styles.permissionsList}>
            {permissions.map((permission, index) =>
              renderPermissionItem(permission, index),
            )}
          </View>
        </ScrollView>
      )}
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionContainer: {
    marginTop: 12,
  },
  container: {
    padding: 16,
    paddingBottom: 24,
  },
  description: {
    marginTop: 4,
  },
  headerInfo: {
    marginBottom: 20,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
  },
  permissionCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    padding: 16,
  },
  permissionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionsList: {
    gap: 12,
  },
  pressed: {
    opacity: 0.8,
  },
  statusIcon: {
    marginLeft: 'auto',
  },
  unavailableContainer: {
    marginTop: 12,
  },
});

export default PermissionScreen;

