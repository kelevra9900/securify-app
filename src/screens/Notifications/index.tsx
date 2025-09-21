// src/screens/NotificationsScreen.tsx

import { useNavigation } from '@react-navigation/native';
import { Bell, CheckCircle2 } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { useNotificationsInfinite } from '@/hooks/notifications/useGetNotifications';

import { CSafeAreaView, Header, TextLabel } from '@/components/atoms';

import { moderateScale } from '@/constants';
import { useTheme } from '@/context/Theme';
import { formatDayHeader, formatWhen } from '@/utils/dates';

// Si ya tienes el tipo en "@/types/notifications" úsalo en vez de este.
type UINotification = {
  body: string;
  createdAt: string; // ISO
  id: number;
  image?: null | string;
  read: boolean;
  route?: null | string; // opcional: deep-link o ruta a detalle
  title: string;
  // ...otros campos que exponga tu API
};

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useNotificationsInfinite({ limit: 20 });

  const items = useMemo<UINotification[]>(
    () =>
      data?.pages.flatMap(
        (p) => (p.items as unknown as UINotification[]) ?? [],
      ) ?? [],
    [data],
  );

  const onEnd = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onPressItem = useCallback(
    (n: UINotification) => {
      // Si tu notificación trae `route` puedes navegar:
      // if (n.route) navigation.navigate(n.route as never);
      // O navega a una pantalla de detalle si la tienes:
      // navigation.navigate(Paths.NotificationDetail, { id: n.id } as never);
    },
    [
      /* navigation */
    ],
  );

  if (isLoading) {
    return (
      <CSafeAreaView
        edges={['top']}
        style={{ backgroundColor: theme.background }}
      >
        <View style={styles.container}>
          <Header title="Notificaciones" />
          <SkeletonList />
        </View>
      </CSafeAreaView>
    );
  }

  return (
    <CSafeAreaView
      edges={['top']}
      style={{ backgroundColor: theme.background }}
    >
      <View style={styles.container}>
        <Header title="Notificaciones" />

        <FlatList
          contentContainerStyle={{ paddingVertical: 12 }}
          data={items}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          keyExtractor={(item) => String(item.id)}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 14 }}>
                <ActivityIndicator />
              </View>
            ) : null
          }
          onEndReached={onEnd}
          onEndReachedThreshold={0.2}
          refreshControl={
            <RefreshControl
              colors={[theme.textSecondary]}
              onRefresh={refetch}
              refreshing={isRefetching}
              tintColor={theme.textSecondary}
            />
          }
          renderItem={({ index, item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onPressItem(item)}
            >
              <MotiView
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                from={{ opacity: 0, scale: 0.98, translateY: 8 }}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.cardBackground,
                    shadowColor: theme.border,
                  },
                ]}
                transition={{
                  delay: index * 40,
                  duration: 300,
                  type: 'timing',
                }}
              >
                {/* Ícono / imagen */}
                <View
                  style={[
                    styles.leftIcon,
                    { backgroundColor: item.read ? '#E8F5E9' : '#EEF2FF' },
                  ]}
                >
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.thumb} />
                  ) : item.read ? (
                    <CheckCircle2 color={'#2E7D32'} size={18} />
                  ) : (
                    <Bell color={'#5C6EF8'} size={18} />
                  )}
                </View>

                {/* Texto */}
                <View style={{ flex: 1 }}>
                  <TextLabel
                    color={theme.textPrimary}
                    numberOfLines={1}
                    type="B14"
                  >
                    {item.title}
                  </TextLabel>
                  <TextLabel
                    color={theme.textSecondary}
                    numberOfLines={2}
                    style={{ marginTop: 2 }}
                    type="R13"
                  >
                    {item.body}
                  </TextLabel>

                  <TextLabel
                    color={theme.textSecondary}
                    style={{ marginTop: 6 }}
                    type="R11"
                  >
                    {formatWhen(item.createdAt)}
                  </TextLabel>
                </View>

                {/* Punto de no leído */}
                {!item.read ? <View style={styles.unreadDot} /> : null}
              </MotiView>
            </TouchableOpacity>
          )}
        />
      </View>
    </CSafeAreaView>
  );
}

function SkeletonList() {
  return (
    <View style={{ gap: 10, paddingVertical: 12 }}>
      {[...Array(6)].map((_, i) => (
        <MotiView
          animate={{ opacity: 1 }}
          from={{ opacity: 0.4 }}
          key={i}
          style={[styles.card, { backgroundColor: 'rgba(150,150,150,0.10)' }]}
          transition={{
            delay: i * 60,
            duration: 900,
            loop: true,
            type: 'timing',
          }}
        >
          <View
            style={[
              styles.leftIcon,
              { backgroundColor: 'rgba(150,150,150,0.20)' },
            ]}
          />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={styles.skLineWide} />
            <View style={styles.skLine} />
            <View style={[styles.skLine, { width: '30%' }]} />
          </View>
        </MotiView>
      ))}
    </View>
  );
}

const AV_SIZE = moderateScale(40);

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: 14,
    elevation: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { paddingBottom: 4, paddingTop: 12 },
  leftIcon: {
    alignItems: 'center',
    borderRadius: AV_SIZE / 2,
    height: AV_SIZE,
    justifyContent: 'center',
    overflow: 'hidden',
    width: AV_SIZE,
  },
  skLine: {
    backgroundColor: 'rgba(150,150,150,0.25)',
    borderRadius: 6,
    height: 10,
    width: '55%',
  },
  skLineWide: {
    backgroundColor: 'rgba(150,150,150,0.25)',
    borderRadius: 6,
    height: 12,
    width: '85%',
  },
  thumb: { borderRadius: AV_SIZE / 2, height: AV_SIZE, width: AV_SIZE },
  unreadDot: {
    alignSelf: 'flex-start',
    backgroundColor: '#5C6EF8',
    borderRadius: 4,
    height: 8,
    marginTop: 6,
    width: 8,
  },
});
