import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/types';
import type { RoundListItem } from '@/types/rounds';

import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  useActiveRound,
  useAvailableRounds,
  useStartRound,
} from '@/hooks/rounds';
import { Paths } from '@/navigation/paths';

import { CSafeAreaView, Header, PrimaryButton } from '@/components/atoms';

import { darkTheme } from '@/assets/theme';
import { showSuccessToast } from '@/utils/toast';

export default function RoundPreviewScreen() {
  const nav = useNavigation<NavigationProp<RootStackParamList>>();
  const { data, isError, isLoading, isRefetching, refetch } =
    useAvailableRounds();
  const { data: active } = useActiveRound(); // { id, name, done, total, startedAtISO }
  const { mutate: startRound } = useStartRound();

  const items = data ?? [];
  const hasActive = !!active?.data?.id;

  const onPressResume = useCallback(() => {
    if (!active?.data?.id) {
      return;
    }
    nav.navigate(Paths.Walk);
  }, [active?.data?.id, nav]);

  const empty = useMemo(
    () => !isLoading && !isError && items.length === 0,
    [isLoading, isError, items.length],
  );

  if (isLoading) {
    return (
      <CSafeAreaView edges={['top']} style={styles.center}>
        <Header title="Caminatas" />
        <ActivityIndicator color={darkTheme.highlight} />
      </CSafeAreaView>
    );
  }

  if (isError) {
    return (
      <CSafeAreaView edges={['top']} style={styles.center}>
        <Header title="Caminatas" />
        <Text style={styles.text}>No pudimos cargar tus rondas.</Text>
        <Text onPress={() => refetch()} style={styles.link}>
          Reintentar
        </Text>
      </CSafeAreaView>
    );
  }

  const contentStyle =
    items.length === 0 ? { ...styles.list, flex: 1 } : styles.list;

  return (
    <CSafeAreaView
      edges={['top']}
      style={{ backgroundColor: darkTheme.background, flex: 1 }}
    >
      <Header title="Caminatas" />

      {/* Banner de ronda en curso */}
      {hasActive && (
        <ActiveRoundBanner
          done={active!.data?.checkpoints.length ?? 0}
          name={active!.data?.name ?? ''}
          onResume={onPressResume}
          startedAtISO={active!.data?.startedAtISO}
          total={active!.data?.progress.total ?? 0}
        />
      )}

      {empty ? (
        <EmptyState onRefresh={refetch} />
      ) : (
        <FlashList
          contentContainerStyle={contentStyle}
          data={items}
          estimatedItemSize={112}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          keyExtractor={(i) => String(i.id)}
          refreshControl={
            <RefreshControl
              colors={[darkTheme.highlight]}
              onRefresh={refetch}
              refreshing={isRefetching}
              tintColor={darkTheme.highlight}
            />
          }
          renderItem={({ item }) => (
            <RoundCard
              item={item}
              onContinue={() => {
                nav.navigate(Paths.Walk);
              }}
              onStart={() => nav.navigate(Paths.Walk)}
            />
          )}
        />
      )}
    </CSafeAreaView>
  );
}

function ActiveRoundBanner({
  done,
  name,
  onResume,
  startedAtISO = undefined,
  total,
}: {
  done: number;
  name: string;
  onResume: () => void;
  startedAtISO?: string;
  total: number;
}) {
  const startedAt = startedAtISO
    ? new Date(startedAtISO).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <View style={styles.banner}>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.bannerTitle}>
          Ronda en curso
        </Text>
        <Text numberOfLines={1} style={styles.bannerMeta}>
          {name} · {done}/{total} {startedAt ? `· ${startedAt}` : ''}
        </Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onResume}
        style={styles.bannerBtn}
      >
        <Text style={styles.bannerBtnText}>REANUDAR</Text>
      </TouchableOpacity>
    </View>
  );
}

// ✅ cambia la firma para NO restringir status
function RoundCard({
  item,
  onContinue,
  onStart,
}: {
  item: { doneCheckpoints?: number } & RoundListItem; // 👈 no tocamos status
  onContinue: () => void;
  onStart: () => void;
}) {
  const done = item.doneCheckpoints ?? 0;
  const total = item.totalCheckpoints ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // 👇 normaliza status a uno entendible por la tarjeta
  type UiStatus = 'ACTIVE' | 'COMPLETED' | 'IN_PROGRESS';
  const toUiStatus = (s: RoundListItem['status'] | undefined): UiStatus => {
    switch (s) {
      case 'ACTIVE':
        return 'ACTIVE';
      case 'COMPLETED':
      case 'VERIFIED': // 👈 tratamos VERIFIED como COMPLETED para UI
        return 'COMPLETED';
      case 'IN_PROGRESS':
        return 'IN_PROGRESS';
      default:
        return 'ACTIVE';
    }
  };

  const uiStatus = toUiStatus(item.status);
  const isInProgress = uiStatus === 'IN_PROGRESS';
  const isActive = uiStatus === 'ACTIVE';

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text numberOfLines={1} style={styles.title}>
          {item.name}
        </Text>
        <View
          style={[
            styles.badge,
            isInProgress ? styles.badgeInProgress : styles.badgeIdle,
          ]}
        >
          <Text style={styles.badgeText}>
            {isInProgress
              ? 'En curso'
              : uiStatus === 'COMPLETED'
                ? 'Completada'
                : 'Activa'}
          </Text>
        </View>
      </View>

      <View style={{ height: 6 }} />
      <Text style={styles.meta}>
        {new Date(item.startISO).toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
        })}
        {item.endISO
          ? ` - ${new Date(item.endISO).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`
          : ''}
      </Text>
      <Text style={styles.meta}>
        {total} checkpoints · {pct}% completado
      </Text>

      <View style={{ height: 12 }} />
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>

      <View style={{ height: 12 }} />
      <View style={styles.cardRow}>
        <Text style={styles.meta}>
          {done}/{total} completados
        </Text>
        {isInProgress ? (
          <PrimaryButton label="Continuar" onPress={onContinue} />
        ) : isActive ? (
          <PrimaryButton label="Iniciar" onPress={onStart} />
        ) : null}
      </View>
    </View>
  );
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <View style={[styles.center, { paddingHorizontal: 24 }]}>
      <Text style={styles.emptyTitle}>Sin rondas disponibles</Text>
      <Text style={styles.emptyText}>
        No tienes caminatas asignadas por ahora. Desliza hacia abajo para
        actualizar.
      </Text>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onRefresh}
        style={styles.tryBtn}
      >
        <Text style={styles.tryBtnText}>Actualizar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    backgroundColor: darkTheme.background,
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    padding: 16,
  },

  // Banner activo
  banner: {
    alignItems: 'center',
    backgroundColor: darkTheme.cardBackground,
    borderColor: darkTheme.highlight,
    borderLeftWidth: 3,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    marginHorizontal: 16,
    padding: 12,
  },
  bannerBtn: {
    backgroundColor: darkTheme.highlight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bannerBtnText: { color: '#0B0B0B', fontSize: 12, fontWeight: '700' },
  bannerMeta: { color: darkTheme.textSecondary, fontSize: 12, marginTop: 2 },
  bannerTitle: {
    color: darkTheme.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },

  // Card
  card: {
    backgroundColor: darkTheme.cardBackground,
    borderColor: darkTheme.border,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  cardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  meta: { color: darkTheme.textSecondary, fontSize: 12, marginTop: 2 },
  title: {
    color: darkTheme.textPrimary,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },

  // Badge
  badge: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeIdle: { backgroundColor: 'transparent', borderColor: darkTheme.border },
  badgeInProgress: {
    backgroundColor: `${darkTheme.highlight}22`,
    borderColor: darkTheme.highlight,
  },
  badgeText: {
    color: darkTheme.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },

  // Progreso
  progressFill: {
    backgroundColor: darkTheme.highlight,
    height: 6,
  },
  progressTrack: {
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    height: 6,
    overflow: 'hidden',
  },

  // Empty state
  emptyText: {
    color: darkTheme.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyTitle: {
    color: darkTheme.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  tryBtn: {
    backgroundColor: darkTheme.cardBackground,
    borderColor: darkTheme.border,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tryBtnText: { color: darkTheme.textPrimary, fontWeight: '700' },

  // Links / feedback
  link: {
    color: darkTheme.highlight,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  text: { color: darkTheme.textPrimary, marginTop: 8 },
});
