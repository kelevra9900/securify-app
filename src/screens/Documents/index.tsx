/* eslint-disable no-console */
// src/screens/MyDocumentsScreen.tsx
import type {ListRenderItem} from '@shopify/flash-list';
import type {UserDocumentDTO} from '@/types/documents';

import {FlashList} from '@shopify/flash-list';
import React,{useCallback,useMemo} from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {useInfiniteMyDocuments} from '@/hooks/documents/useMyDocuments';

import {CSafeAreaView,Header} from '@/components/atoms';

import {colors,darkTheme} from '@/assets/theme';
import {getDocumentSignedUrl} from '@/data/services/files';
import {
  getExtFromName,
  getFileNameFromPath,
  pickFileIcon,
} from '@/utils/documents';

// --- utils de formato simples (sin libs) ---
function fmtDate(iso: null | string) {
  if (!iso) {
    return '—';
  }
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX',{
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}
function isExpired(iso: null | string) {
  if (!iso) {
    return false;
  }
  return new Date(iso).getTime() < Date.now();
}
function isExpiringSoon(iso: null | string,days = 30) {
  if (!iso) {
    return false;
  }
  const diffDays = (new Date(iso).getTime() - Date.now()) / 86_400_000;
  return diffDays > 0 && diffDays <= days;
}

const SEPARATOR = 12;

const MyDocumentsScreen = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteMyDocuments(
    {
      includeSignedUrl: true,
      perPage: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    {
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  );

  const items = useMemo<UserDocumentDTO[]>(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  const openDoc = useCallback(async (doc: UserDocumentDTO) => {
    try {
      const url = doc.signedUrl
        ? doc.signedUrl
        : (
          await getDocumentSignedUrl(doc.id,{
            downloadName: doc.documentType?.slug
              ? `${doc.documentType.slug}-${doc.id}`
              : undefined,
          })
        ).url;

      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.warn('No se pudo abrir el documento',error);
    }
  },[]);

  const renderItem: ListRenderItem<UserDocumentDTO> = ({item}) => {
    const expired = isExpired(item.validUntil);
    const expSoon = isExpiringSoon(item.validUntil);

    const badgeBox = expired
      ? styles.badgeDanger
      : expSoon
        ? styles.badgeWarn
        : styles.badgeOk;
    const badgeText = expired
      ? styles.badgeTextLight
      : expSoon
        ? styles.badgeTextDark
        : styles.badgeTextLight;

    const suggestedName = item.documentType?.slug
      ? `${item.documentType.slug.toUpperCase()}_${item.id}`
      : getFileNameFromPath(item.filePath);
    const ext = getExtFromName(getFileNameFromPath(item.filePath));

    const Icon = pickFileIcon(ext);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openDoc(item)}
        style={styles.card}
      >
        {/* fila superior: título + badge */}
        <View style={styles.row}>
          <Text numberOfLines={1} style={styles.title}>
            {item.documentType?.name ?? 'Documento'}
          </Text>
          <View style={[styles.badge,badgeBox]}>
            <Text style={[styles.badgeTextBase,badgeText]}>
              {expired ? 'Vencido' : expSoon ? 'Próximo a vencer' : 'Vigente'}
            </Text>
          </View>
        </View>

        <View style={{height: 6}} />

        {/* fechas */}
        <View style={styles.row}>
          <Text style={styles.meta}>Emitido: {fmtDate(item.issuedAt)}</Text>
          <Text style={styles.meta}>Vence: {fmtDate(item.validUntil)}</Text>
        </View>

        <View style={{height: 10}} />

        {/* fila inferior: icono + nombre + pill de extensión + botón más */}
        <View style={styles.bottomRow}>
          <View style={styles.fileInfo}>
            <Icon color={darkTheme.textSecondary} size={16} />
            <Text numberOfLines={1} style={styles.fileName}>
              {suggestedName}
            </Text>
            {!!ext && (
              <View style={styles.extPill}>
                <Text style={styles.extPillText}>{ext}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading / Error / Empty conservan header fijo arriba
  if (isLoading) {
    return (
      <CSafeAreaView
        edges={['top']}
        style={{backgroundColor: darkTheme.background}}
      >
        <Header title="Mis documentos" />
        <ActivityIndicator
          color={darkTheme.highlight}
          style={styles.centerScreen}
        />
      </CSafeAreaView>
    );
  }

  if (isError) {
    return (
      <CSafeAreaView edges={['top']} style={styles.centerScreen}>
        <Header title="Mis documentos" />
        <Text style={styles.errorText}>No pudimos cargar tus documentos.</Text>
        <Text onPress={() => refetch()} style={styles.retryLink}>
          Reintentar
        </Text>
      </CSafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <CSafeAreaView edges={['top']} style={styles.centerScreen}>
        <Header title="Mis documentos" />
        <Text style={styles.emptyTitle}>Sin documentos</Text>
        <Text style={styles.emptySubtitle}>
          Sube tu primer documento desde la sección correspondiente.
        </Text>
        <Text onPress={() => refetch()} style={styles.retryLink}>
          Actualizar
        </Text>
      </CSafeAreaView>
    );
  }

  return (
    <CSafeAreaView
      edges={['top']}
      style={{backgroundColor: darkTheme.background,flex: 1}}
    >
      <Header
        rightSlot={
          <Text
            onPress={() => refetch()}
            style={{color: darkTheme.highlight}}
          >
            Actualizar
          </Text>
        }
        title="Mis documentos"
      />

      <FlashList
        contentContainerStyle={styles.listContainer}
        data={items}
        estimatedItemSize={120}
        ItemSeparatorComponent={() => <View style={{height: SEPARATOR}} />}
        keyExtractor={(d) => String(d.id)}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{paddingVertical: 16}}>
              <ActivityIndicator color={darkTheme.highlight} />
            </View>
          ) : (
            <View style={{height: 24}} />
          )
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        onRefresh={() => refetch()}
        refreshing={isFetching && !isFetchingNextPage}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: darkTheme.cardBackground,
    borderColor: darkTheme.border,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  listContainer: {
    backgroundColor: darkTheme.background,
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  meta: {color: darkTheme.textSecondary,fontSize: 12},

  path: {color: darkTheme.textSecondary,fontSize: 11},
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: darkTheme.textPrimary,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },

  // Badge
  badge: {borderRadius: 999,paddingHorizontal: 10,paddingVertical: 4},
  badgeDanger: {backgroundColor: darkTheme.error},
  badgeOk: {backgroundColor: colors.success},
  badgeTextBase: {fontSize: 11},
  badgeTextDark: {color: colors.textBadge},
  badgeTextLight: {color: colors.white},
  badgeWarn: {backgroundColor: colors.warning},
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  extPill: {
    backgroundColor: colors.backgroundColor4, // semitransparente en tu paleta
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  extPillText: {
    color: darkTheme.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  fileInfo: {alignItems: 'center',flex: 1,flexDirection: 'row',gap: 8},
  fileName: {
    color: darkTheme.textSecondary,
    flex: 1,
    fontSize: 12,
    marginLeft: 6,
  },
  // States
  centerScreen: {
    alignItems: 'center',
    backgroundColor: darkTheme.background,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptySubtitle: {
    color: darkTheme.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    color: darkTheme.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  errorText: {color: darkTheme.textPrimary,marginBottom: 12},
  retryLink: {color: darkTheme.highlight,textDecorationLine: 'underline'},
});

export default MyDocumentsScreen;
