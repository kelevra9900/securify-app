// src/screens/RoundsScreen.tsx
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/types';
import type { PastRound } from '@/types/rounds';
import type { RoundListItem } from '@/types/rounds';

import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAvailableRounds } from '@/hooks/rounds';
import { Paths } from '@/navigation/paths';

import { CSafeAreaView, PrimaryButton } from '@/components/atoms';
import { CheckpointList } from '@/components/molecules';
import { PastRoundsSummaryCard } from '@/components/organisms';

import { darkTheme } from '@/assets/theme';
import { useTheme } from '@/context/Theme';
import { mapPastStatus } from '@/types/rounds';
import { fmtShortRange } from '@/utils/rounds';

const RoundsScreen = () => {
  const { theme } = useTheme();
  const {
    data: rounds,
    isError,
    isLoading,
    isRefetching,
    refetch,
  } = useAvailableRounds();
  const nav = useNavigation<NavigationProp<RootStackParamList>>();

  const hero = useMemo<null | RoundListItem>(() => {
    if (!rounds?.length) {
      return null;
    }
    return (
      rounds.find((r) => r.status === 'IN_PROGRESS') ??
      rounds.find((r) => r.status === 'ACTIVE') ??
      null
    );
  }, [rounds]);

  const pastRounds: PastRound[] = useMemo(
    () =>
      (rounds ?? []).map((r) => ({
        date: fmtShortRange(r.startISO, r.endISO),
        id: String(r.id),
        name: r.name,
        status: mapPastStatus(r.status),
      })),
    [rounds],
  );
  if (isLoading) {
    return (
      <CSafeAreaView
        edges={['top']}
        style={[styles.centerBase, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator color={darkTheme.highlight} />
      </CSafeAreaView>
    );
  }

  if (isError) {
    return (
      <CSafeAreaView
        edges={['top']}
        style={[styles.centerBase, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.errBase, { color: theme.textPrimary }]}>
          No pudimos cargar tus rondas.
        </Text>
        <Text onPress={() => refetch()} style={styles.link}>
          Reintentar
        </Text>
      </CSafeAreaView>
    );
  }

  return (
    <CSafeAreaView
      edges={['top']}
      style={{ backgroundColor: theme.background }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            colors={[darkTheme.highlight]}
            onRefresh={() => refetch()}
            refreshing={isRefetching}
            tintColor={darkTheme.highlight}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* {hero ? (
						detailLoading ? (
							<View style={styles.heroSkeleton}>
								<ActivityIndicator color={darkTheme.highlight} />
							</View>
						) : (
							<CurrentRoundStatusCard
								checkpointsCompleted={completedCount}
								remainingTime={remainingTime}
								roundName={detail?.name ?? hero.name}
								status={cardStatus}
								totalCheckpoints={totalCheckpoints}
							/>
						)
					) : (
						<View style={styles.placeholderHero}>
							<Text style={styles.placeholderText}>No tienes una caminata activa</Text>
						</View>
					)} */}

          <CheckpointList items={hero?.checkpoints} />

          <PastRoundsSummaryCard
            errorText={isError ? 'No pudimos cargar tus rondas.' : undefined}
            limit={5}
            loading={isLoading}
            onItemPress={(id) => {
              // navegación al detalle: navigation.navigate('RoundDetail', { id })
            }}
            onRetry={refetch}
            onSeeAll={() => {
              // navegación a listado completo: navigation.navigate('RoundsHistory')
            }}
            rounds={pastRounds}
          />

          <View>
            <PrimaryButton
              label="Iniciar caminata"
              onPress={() => nav.navigate(Paths.PreviewRound)}
            />
          </View>
        </View>
      </ScrollView>
    </CSafeAreaView>
  );
};

export default RoundsScreen;

const styles = StyleSheet.create({
  container: { paddingBottom: 60, paddingHorizontal: 20, paddingTop: 12 },
  content: { gap: 16 },

  // ❌ antes era una función; ✅ ahora es base estática
  centerBase: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errBase: { marginTop: 8 },

  heroSkeleton: {
    alignItems: 'center',
    backgroundColor: darkTheme.cardBackground,
    borderColor: darkTheme.border,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    padding: 24,
  },

  link: {
    color: darkTheme.highlight,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  placeholderHero: {
    backgroundColor: darkTheme.cardBackground,
    borderColor: darkTheme.border,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  placeholderText: { color: darkTheme.textSecondary, textAlign: 'center' },
});
