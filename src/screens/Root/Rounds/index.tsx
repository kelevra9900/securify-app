// src/screens/RoundsScreen.tsx
import type {NavigationProp} from '@react-navigation/native';
import type {RootStackParamList} from '@/navigation/types';
import type {PastRound} from '@/types/rounds';
import type {RoundListItem} from '@/types/rounds';

import {useNavigation} from '@react-navigation/native';
import React,{useMemo,useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {MotiView} from 'moti';
import {CheckCircle,ChevronRight,Clock,MapPin,RotateCw} from 'lucide-react-native';

import {useActiveRound,useAvailableRounds,useRestartRound} from '@/hooks/rounds';
import {Paths} from '@/navigation/paths';

import {CSafeAreaView,PrimaryButton} from '@/components/atoms';
import {ActiveRoundModal,CheckpointList} from '@/components/molecules';
import {PastRoundsSummaryCard} from '@/components/organisms';

import {darkTheme} from '@/assets/theme';
import {useTheme} from '@/context/Theme';
import {mapPastStatus} from '@/types/rounds';
import {fmtShortRange} from '@/utils/rounds';
import {showErrorToast,showSuccessToast} from '@/utils/toast';

const RoundsScreen = () => {
  const {theme} = useTheme();
  const {
    data: rounds,
    isError,
    isLoading,
    isRefetching,
    refetch,
  } = useAvailableRounds();
  const {data: activeRound} = useActiveRound();
  const nav = useNavigation<NavigationProp<RootStackParamList>>();
  const [showActiveRoundModal,setShowActiveRoundModal] = useState(false);

  const {isPending: isRestarting,mutateAsync: restartRound} = useRestartRound();



  // Ronda en progreso (IN_PROGRESS)
  const inProgressRound = useMemo<null | RoundListItem>(() => {
    if (!rounds?.length) {
      return null;
    }
    return rounds.find((r) => r.status === 'IN_PROGRESS') ?? null;
  },[rounds]);

  // Rondas disponibles (ACTIVE)
  const activeRounds = useMemo<RoundListItem[]>(() => {
    if (!rounds?.length) {
      return [];
    }
    return rounds.filter((r) => r.status === 'ACTIVE');
  },[rounds]);

  // Rondas COMPLETADAS que son CÍCLICAS (pueden reiniciarse)
  const completedCyclicRounds = useMemo<RoundListItem[]>(() => {
    if (!rounds?.length) {
      return [];
    }
    return rounds.filter(
      (r) => (r.status === 'COMPLETED' || r.status === 'VERIFIED') && r.isCyclic === true
    );
  },[rounds]);

  const hasActiveRound = !!activeRound?.data?.id;

  // Historial de rondas completadas (no cíclicas o ya archivadas)
  const pastRounds: PastRound[] = useMemo(
    () =>
      (rounds ?? [])
        .filter((r) =>
          (r.status === 'COMPLETED' || r.status === 'VERIFIED') &&
          r.isCyclic !== true // Solo mostrar en historial si NO es cíclica
        )
        .map((r) => ({
          completedCheckpoints: r.completedCheckpoints,
          date: fmtShortRange(r.startISO,r.endISO),
          id: String(r.id),
          isCyclic: r.isCyclic,
          name: r.name,
          status: mapPastStatus(r.status),
          totalCheckpoints: r.totalCheckpoints,
        })),
    [rounds],
  );

  const handleStartRound = (roundId: number) => {
    if (hasActiveRound) {
      setShowActiveRoundModal(true);
      return;
    }
    nav.navigate(Paths.Walk,{roundId});
  };

  const handleRestartRound = async (roundId: number) => {
    if (hasActiveRound) {
      setShowActiveRoundModal(true);
      return;
    }

    try {
      await restartRound({roundId});
      showSuccessToast('Ronda reiniciada correctamente');
      nav.navigate(Paths.Walk,{roundId});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al reiniciar la ronda';
      showErrorToast(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <CSafeAreaView
        edges={['top']}
        style={[styles.centerBase,{backgroundColor: theme.background}]}
      >
        <ActivityIndicator color={darkTheme.highlight} size="large" />
        <Text style={[styles.loadingText,{color: theme.textSecondary}]}>
          Cargando rondas...
        </Text>
      </CSafeAreaView>
    );
  }

  if (isError) {
    return (
      <CSafeAreaView
        edges={['top']}
        style={[styles.centerBase,{backgroundColor: theme.background}]}
      >
        <Text style={[styles.errorTitle,{color: theme.textPrimary}]}>
          Error al cargar rondas
        </Text>
        <Text style={[styles.errorText,{color: theme.textSecondary}]}>
          No pudimos cargar tus rondas. Verifica tu conexión.
        </Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </CSafeAreaView>
    );
  }

  const totalRounds = activeRounds.length + completedCyclicRounds.length + (inProgressRound ? 1 : 0);
  const showEmptyState = totalRounds === 0 && pastRounds.length === 0;

  return (
    <>
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
              refreshing={isRefetching}
              tintColor={darkTheme.highlight}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <Text style={[styles.pageTitle,{color: theme.textPrimary}]}>
                Mis Rondas
              </Text>
              <Text style={[styles.pageSubtitle,{color: theme.textSecondary}]}>
                {totalRounds > 0
                  ? `${totalRounds} ${totalRounds === 1 ? 'ronda disponible' : 'rondas disponibles'}`
                  : 'Sin rondas activas'}
              </Text>
            </View>

            {/* Ronda EN CURSO (IN_PROGRESS) */}
            {inProgressRound && (
              <MotiView
                animate={{opacity: 1,translateY: 0}}
                from={{opacity: 0,translateY: 20}}
                transition={{delay: 100,duration: 400,type: 'timing'}}
              >
                <InProgressRoundCard
                  onPress={() => nav.navigate(Paths.Walk,{roundId: inProgressRound.id})}
                  round={inProgressRound}
                />
              </MotiView>
            )}

            {/* Lista de checkpoints de la ronda activa */}
            {inProgressRound && (
              <MotiView
                animate={{opacity: 1,translateY: 0}}
                from={{opacity: 0,translateY: 20}}
                transition={{delay: 200,duration: 400,type: 'timing'}}
              >
                <CheckpointList items={inProgressRound.checkpoints} />
              </MotiView>
            )}

            {/* Rondas DISPONIBLES (ACTIVE) */}
            {activeRounds.length > 0 && (
              <MotiView
                animate={{opacity: 1,translateY: 0}}
                from={{opacity: 0,translateY: 20}}
                transition={{delay: 300,duration: 400,type: 'timing'}}
              >
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <MapPin color={darkTheme.highlight} size={20} />
                    <Text style={[styles.sectionTitle,{color: theme.textPrimary}]}>
                      Rondas Disponibles
                    </Text>
                  </View>
                  <Text style={[styles.sectionSubtitle,{color: theme.textSecondary}]}>
                    {hasActiveRound
                      ? 'Finaliza tu ronda actual para iniciar otra'
                      : 'Toca una ronda para comenzar'}
                  </Text>

                  <View style={styles.roundsGrid}>
                    {activeRounds.map((round,index) => (
                      <MotiView
                        animate={{opacity: 1,scale: 1}}
                        from={{opacity: 0,scale: 0.9}}
                        key={round.id}
                        transition={{
                          delay: 400 + (index * 100),
                          duration: 300,
                          type: 'timing',
                        }}
                      >
                        <ActiveRoundCard
                          disabled={hasActiveRound}
                          onPress={() => handleStartRound(round.id)}
                          round={round}
                        />
                      </MotiView>
                    ))}
                  </View>
                </View>
              </MotiView>
            )}

            {/* Rondas COMPLETADAS CÍCLICAS (pueden reiniciarse) */}
            {completedCyclicRounds.length > 0 && (
              <MotiView
                animate={{opacity: 1,translateY: 0}}
                from={{opacity: 0,translateY: 20}}
                transition={{delay: 400,duration: 400,type: 'timing'}}
              >
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <RotateCw color="#10B981" size={20} />
                    <Text style={[styles.sectionTitle,{color: theme.textPrimary}]}>
                      Rondas Completadas (Cíclicas)
                    </Text>
                  </View>
                  <Text style={[styles.sectionSubtitle,{color: theme.textSecondary}]}>
                    Estas rondas pueden reiniciarse para una nueva vuelta
                  </Text>

                  <View style={styles.roundsGrid}>
                    {completedCyclicRounds.map((round,index) => (
                      <MotiView
                        animate={{opacity: 1,scale: 1}}
                        from={{opacity: 0,scale: 0.9}}
                        key={round.id}
                        transition={{
                          delay: 500 + (index * 100),
                          duration: 300,
                          type: 'timing',
                        }}
                      >
                        <CompletedCyclicRoundCard
                          disabled={hasActiveRound || isRestarting}
                          onPress={() => handleRestartRound(round.id)}
                          round={round}
                        />
                      </MotiView>
                    ))}
                  </View>
                </View>
              </MotiView>
            )}

            {/* Historial de rondas completadas */}
            {pastRounds.length > 0 && (
              <MotiView
                animate={{opacity: 1,translateY: 0}}
                from={{opacity: 0,translateY: 20}}
                transition={{delay: 500,duration: 400,type: 'timing'}}
              >
                <PastRoundsSummaryCard
                  errorText={isError ? 'No pudimos cargar tus rondas.' : undefined}
                  limit={5}
                  loading={isLoading}
                  onItemPress={(id) => {
                    // Ver detalles de ronda completada
                    nav.navigate(Paths.Walk,{roundId: Number(id)});
                  }}
                  onRetry={refetch}
                  onSeeAll={() => {
                    // navegación a listado completo
                  }}
                  rounds={pastRounds}
                  title="Historial de Rondas"
                />
              </MotiView>
            )}

            {/* Empty State */}
            {showEmptyState && (
              <MotiView
                animate={{opacity: 1,scale: 1}}
                from={{opacity: 0,scale: 0.95}}
                style={styles.emptyState}
                transition={{duration: 400,type: 'timing'}}
              >
                <View style={styles.emptyIcon}>
                  <MapPin color={darkTheme.textSecondary} size={48} />
                </View>
                <Text style={[styles.emptyTitle,{color: theme.textPrimary}]}>
                  Sin rondas asignadas
                </Text>
                <Text style={[styles.emptyText,{color: theme.textSecondary}]}>
                  No tienes rondas disponibles en este momento.
                  Desliza hacia abajo para actualizar.
                </Text>
              </MotiView>
            )}

            {/* Botón principal */}
            {!showEmptyState && (
              <View style={styles.actionSection}>
                <PrimaryButton
                  label="Ver Todas las Rondas"
                  onPress={() => nav.navigate(Paths.PreviewRound)}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </CSafeAreaView>

      {/* Modal de advertencia */}
      <ActiveRoundModal
        activeName={activeRound?.data?.name || 'Caminata desconocida'}
        activeProgress={
          activeRound?.data?.progress
            ? `${activeRound.data.checkpoints?.length || 0}/${activeRound.data.progress.total || 0} checkpoints completados`
            : 'Progreso no disponible'
        }
        onCancel={() => setShowActiveRoundModal(false)}
        onContinue={() => {
          setShowActiveRoundModal(false);
          if (activeRound?.data?.id) {
            nav.navigate(Paths.Walk,{roundId: activeRound.data.id});
          }
        }}
        visible={showActiveRoundModal}
      />
    </>
  );
};

/* ───────────────────────────── Components ───────────────────────────── */

function InProgressRoundCard({
  onPress,
  round,
}: {
  onPress: () => void;
  round: RoundListItem;
}) {
  const done = round.completedCheckpoints ?? 0;
  const total = round.totalCheckpoints ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.inProgressCard}
    >
      <View style={styles.inProgressHeader}>
        <View style={styles.inProgressBadge}>
          <View style={styles.pulsingDot} />
          <Text style={styles.inProgressBadgeText}>EN CURSO</Text>
        </View>
        <ChevronRight color={darkTheme.highlight} size={20} />
      </View>

      <Text style={styles.inProgressTitle}>{round.name}</Text>

      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill,{width: `${pct}%`}]} />
        </View>
        <Text style={styles.progressText}>
          {done}/{total} checkpoints · {pct}%
        </Text>
      </View>

      <View style={styles.inProgressFooter}>
        <Clock color={darkTheme.textSecondary} size={14} />
        <Text style={styles.inProgressTime}>
          Iniciada: {new Date(round.startISO).toLocaleTimeString('es-MX',{
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ActiveRoundCard({
  disabled,
  onPress,
  round,
}: {
  disabled: boolean;
  onPress: () => void;
  round: RoundListItem;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.activeCard,
        disabled && styles.activeCardDisabled,
      ]}
    >
      <View style={styles.activeCardHeader}>
        <CheckCircle
          color={disabled ? darkTheme.border : darkTheme.highlight}
          size={24}
        />
        <Text
          numberOfLines={2}
          style={[
            styles.activeCardTitle,
            {color: disabled ? darkTheme.textSecondary : darkTheme.textPrimary},
          ]}
        >
          {round.name}
        </Text>
      </View>

      <View style={styles.activeCardMeta}>
        <MapPin
          color={darkTheme.textSecondary}
          size={14}
        />
        <Text style={styles.activeCardMetaText}>
          {round.totalCheckpoints} checkpoints
        </Text>
      </View>

      <View style={styles.activeCardMeta}>
        <Clock
          color={darkTheme.textSecondary}
          size={14}
        />
        <Text style={styles.activeCardMetaText}>
          {new Date(round.startISO).toLocaleTimeString('es-MX',{
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      <View
        style={[
          styles.activeCardButton,
          {backgroundColor: disabled ? darkTheme.border : darkTheme.highlight},
        ]}
      >
        <Text
          style={[
            styles.activeCardButtonText,
            {opacity: disabled ? 0.5 : 1},
          ]}
        >
          {disabled ? 'Finaliza la actual' : 'Iniciar Ronda'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function CompletedCyclicRoundCard({
  disabled,
  onPress,
  round,
}: {
  disabled: boolean;
  onPress: () => void;
  round: RoundListItem;
}) {
  const done = round.completedCheckpoints ?? round.totalCheckpoints ?? 0;
  const total = round.totalCheckpoints ?? 0;
  const laps = round.completedLaps ?? 0;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.cyclicCard,
        disabled && styles.activeCardDisabled,
      ]}
    >
      <View style={styles.cyclicBadge}>
        <RotateCw color="#10B981" size={14} />
        <Text style={styles.cyclicBadgeText}>CÍCLICA</Text>
      </View>

      <Text
        numberOfLines={2}
        style={[
          styles.cyclicCardTitle,
          {color: disabled ? darkTheme.textSecondary : darkTheme.textPrimary},
        ]}
      >
        {round.name}
      </Text>

      <View style={styles.cyclicStats}>
        <View style={styles.cyclicStat}>
          <Text style={styles.cyclicStatValue}>{done}/{total}</Text>
          <Text style={styles.cyclicStatLabel}>checkpoints</Text>
        </View>
        {laps > 0 && (
          <View style={styles.cyclicStat}>
            <Text style={styles.cyclicStatValue}>{laps}</Text>
            <Text style={styles.cyclicStatLabel}>
              {laps === 1 ? 'vuelta' : 'vueltas'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.activeCardMeta}>
        <Clock color={darkTheme.textSecondary} size={14} />
        <Text style={styles.activeCardMetaText}>
          Completada: {new Date(round.endISO || round.startISO).toLocaleTimeString('es-MX',{
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      <View
        style={[
          styles.cyclicButton,
          {backgroundColor: disabled ? darkTheme.border : '#10B981'},
        ]}
      >
        <RotateCw
          color="white"
          size={16}
        />
        <Text
          style={[
            styles.activeCardButtonText,
            {opacity: disabled ? 0.5 : 1},
          ]}
        >
          {disabled ? 'Finaliza la actual' : 'Reiniciar Ronda'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default RoundsScreen;

/* ───────────────────────────── Styles ───────────────────────────── */

const styles = StyleSheet.create({
  actionSection: {
    marginTop: 8,
  },

  activeCard: {
    backgroundColor: darkTheme.cardBackground,
    borderColor: darkTheme.border,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 180,
    padding: 16,
    width: '100%',
  },

  activeCardButton: {
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 12,
    paddingVertical: 10,
  },

  activeCardButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },

  activeCardDisabled: {
    opacity: 0.6,
  },

  activeCardHeader: {
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },

  activeCardMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },

  activeCardMetaText: {
    color: darkTheme.textSecondary,
    fontSize: 12,
  },

  activeCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },

  centerBase: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  container: {
    paddingBottom: 60,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  content: {
    gap: 20,
  },

  cyclicBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#10B98122',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  cyclicBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },

  cyclicButton: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
  },

  cyclicCard: {
    backgroundColor: darkTheme.cardBackground,
    borderColor: '#10B981',
    borderLeftWidth: 3,
    borderRadius: 16,
    minHeight: 200,
    padding: 16,
    width: '100%',
  },

  cyclicCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 16,
  },

  cyclicStat: {
    alignItems: 'center',
  },

  cyclicStatLabel: {
    color: darkTheme.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },

  cyclicStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },

  cyclicStatValue: {
    color: darkTheme.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },

  emptyIcon: {
    alignItems: 'center',
    backgroundColor: darkTheme.border,
    borderRadius: 50,
    height: 80,
    justifyContent: 'center',
    marginBottom: 16,
    width: 80,
  },

  emptyState: {
    alignItems: 'center',
    backgroundColor: darkTheme.cardBackground,
    borderRadius: 16,
    marginTop: 40,
    padding: 32,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  errorText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  headerSection: {
    marginBottom: 8,
  },

  inProgressBadge: {
    alignItems: 'center',
    backgroundColor: `${darkTheme.highlight}22`,
    borderRadius: 6,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  inProgressBadgeText: {
    color: darkTheme.highlight,
    fontSize: 11,
    fontWeight: '700',
  },

  inProgressCard: {
    backgroundColor: darkTheme.cardBackground,
    borderColor: darkTheme.highlight,
    borderLeftWidth: 4,
    borderRadius: 16,
    padding: 16,
  },

  inProgressFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },

  inProgressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  inProgressTime: {
    color: darkTheme.textSecondary,
    fontSize: 12,
  },

  inProgressTitle: {
    color: darkTheme.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },

  pageSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
  },

  progressBar: {
    backgroundColor: darkTheme.border,
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },

  progressFill: {
    backgroundColor: darkTheme.highlight,
    height: '100%',
  },

  progressSection: {
    gap: 8,
  },

  progressText: {
    color: darkTheme.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  pulsingDot: {
    backgroundColor: darkTheme.highlight,
    borderRadius: 4,
    height: 8,
    width: 8,
  },

  retryButton: {
    backgroundColor: darkTheme.highlight,
    borderRadius: 8,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },

  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },

  roundsGrid: {
    gap: 12,
    marginTop: 12,
  },

  section: {
    gap: 8,
  },

  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
});
