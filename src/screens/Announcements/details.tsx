// src/screens/AnnouncementDetailScreen.tsx
import type { Paths } from '@/navigation/paths';
// 📌 Cambia estos hooks por los tuyos reales:
import type { RootScreenProps } from '@/navigation/types';

import { useNavigation, useRoute } from '@react-navigation/native';
import { MotiView } from 'moti';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAnnouncement } from '@/hooks/announcements/useGetAnnouncement';

import { CSafeAreaView, Header } from '@/components/atoms';

import { darkTheme } from '@/assets/theme';

// Tipado de lo que esperamos del backend para este detalle
export type AnnouncementDetail = {
  author?: { id: number; name: string } | null; // opcional
  content: string;
  createdAt: string; // ISO
  environmentName?: null | string; // opcional
  id: number;
  image?: null | string;
  is_approved?: boolean | null;
  title: string;
};

type RouteProps = RootScreenProps<Paths.Announcement>['route'];

export default function AnnouncementDetailScreen() {
  const { params } = useRoute<RouteProps>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { data, isError, isLoading, refetch } = useAnnouncement(params.id);
  const item = data as AnnouncementDetail | undefined;

  const onShare = useCallback(async (ann?: AnnouncementDetail) => {
    if (!ann) {
      return;
    }
    try {
      await Share.share({
        message: `${ann.title}\n\n${truncate(ann.content, 180)}${annLink(ann.id)}`,
        title: ann.title,
      });
    } catch {}
  }, []);

  // Botón de compartir en el header
  useEffect(() => {
    navigation.setOptions?.({
      headerRight: () => (
        <TouchableOpacity hitSlop={8} onPress={() => onShare(item)}>
          <Text style={{ color: darkTheme.highlight, fontWeight: '700' }}>
            Compartir
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, item, onShare]);

  const dateLabel = useMemo(() => {
    if (!item?.createdAt) {
      return '';
    }
    const d = new Date(item.createdAt);
    return d.toLocaleString('es-MX', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [item?.createdAt]);

  if (isLoading) {
    return (
      <CSafeAreaView edges={['top']} style={styles.center}>
        <Header title="Anuncio" />
        <ActivityIndicator color={darkTheme.highlight} />
      </CSafeAreaView>
    );
  }

  if (isError || !item) {
    return (
      <CSafeAreaView edges={['top']} style={styles.center}>
        <Header title="Anuncio" />
        <Text style={styles.text}>No pudimos cargar el anuncio.</Text>
        <Text onPress={() => refetch()} style={styles.link}>
          Reintentar
        </Text>
      </CSafeAreaView>
    );
  }

  const readingTime = estimateReadingTime(item.content);

  return (
    <CSafeAreaView
      edges={['top']}
      style={{ backgroundColor: darkTheme.background, flex: 1 }}
    >
      <Header title="Anuncio" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(16, insets.bottom + 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Imagen principal */}
        {Boolean(item.image) && (
          <MotiView
            animate={{ opacity: 1, translateY: 0 }}
            from={{ opacity: 0.0, translateY: 8 }}
            style={styles.heroWrap}
            transition={{ duration: 250, type: 'timing' }}
          >
            <Image
              resizeMode="cover"
              source={{ uri: item.image! }}
              style={styles.hero}
            />
          </MotiView>
        )}

        {/* Título */}
        <MotiView
          animate={{ opacity: 1, translateY: 0 }}
          from={{ opacity: 0, translateY: 6 }}
          transition={{ delay: 80, duration: 200, type: 'timing' }}
        >
          <Text style={styles.title}>{item.title}</Text>

          {/* Metadata */}
          <View style={styles.metaRow}>
            {!!item.environmentName && (
              <Chip text={item.environmentName} tone="idle" />
            )}
            <Chip text={dateLabel} tone="idle" />
            <Chip text={`${readingTime} min de lectura`} tone="idle" />
            {item.is_approved ? (
              <Chip text="Aprobado" tone="ok" />
            ) : (
              <Chip text="Pendiente" tone="warn" />
            )}
          </View>

          {!!item.author?.name && (
            <Text style={styles.author}>Por {item.author.name}</Text>
          )}
        </MotiView>

        {/* Contenido */}
        <MotiView
          animate={{ opacity: 1 }}
          from={{ opacity: 0 }}
          style={{ marginTop: 12 }}
          transition={{ delay: 120, duration: 220, type: 'timing' }}
        >
          {/* Si usas markdown, sustituye este bloque por tu renderer */}
          <Paragraph text={item.content} />
        </MotiView>

        {/* (Opcional) Enlaces detectados simples */}
        {!!firstUrl(item.content) && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => Linking.openURL(firstUrl(item.content)!)}
            style={styles.linkBtn}
          >
            <Text style={styles.linkBtnText}>Abrir enlace</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </CSafeAreaView>
  );
}

/* ───────────────────────────── Atoms ───────────────────────────── */

function Chip({ text, tone }: { text: string; tone: 'idle' | 'ok' | 'warn' }) {
  const bg =
    tone === 'ok' ? '#2ecc7133' : tone === 'warn' ? '#f39c1233' : '#2a2a2a';
  const bd =
    tone === 'ok' ? '#2ecc71' : tone === 'warn' ? '#f39c12' : darkTheme.border;

  return (
    <View style={[styles.chip, { backgroundColor: bg, borderColor: bd }]}>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

function Paragraph({ text }: { text: string }) {
  // Render simple: párrafos separados por doble salto de línea
  const blocks = useMemo(
    () =>
      text
        .split(/\n{2,}/)
        .map((b) => b.trim())
        .filter(Boolean),
    [text],
  );
  return (
    <View style={{ gap: 10 }}>
      {blocks.map((b, i) => (
        <Text key={i} style={styles.contentText}>
          {b}
        </Text>
      ))}
    </View>
  );
}

/* ───────────────────────────── Utils ───────────────────────────── */

function estimateReadingTime(s: string) {
  const words = s.trim().split(/\s+/).length || 0;
  const wpm = 200; // castellano promedio
  return Math.max(1, Math.round(words / wpm));
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '… ' : s;
}

function annLink(id: number) {
  // si tienes web, reemplaza por URL real:
  return `\n\n(trablisa://announcement/${id})`;
}

function firstUrl(s: string): null | string {
  const m = s.match(/\bhttps?:\/\/[^\s)]+/i);
  return m ? m[0] : null;
}

/* ───────────────────────────── Styles ───────────────────────────── */

const styles = StyleSheet.create({
  author: {
    color: darkTheme.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },
  center: {
    alignItems: 'center',
    backgroundColor: darkTheme.background,
    flex: 1,
    justifyContent: 'center',
  },
  chip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  chipText: {
    color: darkTheme.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },

  contentText: {
    color: darkTheme.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  hero: {
    aspectRatio: 16 / 9,
    width: '100%',
  },

  heroWrap: {
    backgroundColor: darkTheme.cardBackground,
    borderColor: darkTheme.border,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    overflow: 'hidden',
  },

  link: {
    color: darkTheme.highlight,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  linkBtn: {
    alignSelf: 'flex-start',
    backgroundColor: darkTheme.cardBackground,
    borderColor: darkTheme.border,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  linkBtnText: { color: darkTheme.textPrimary, fontWeight: '700' },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },

  scroll: { padding: 16 },

  text: { color: darkTheme.textPrimary, marginTop: 8 },
  title: {
    color: darkTheme.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
});
