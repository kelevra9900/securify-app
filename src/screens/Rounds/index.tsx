// src/screens/RoundsHomeScreen.tsx
import React from 'react';
import {ActivityIndicator,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {FlashList} from '@shopify/flash-list';

import {CSafeAreaView,Header} from '@/components/atoms';
import {darkTheme} from '@/assets/theme';
import {useAvailableRounds} from '@/hooks/rounds';
import type {RoundListItem} from '@/types/rounds';

export default function RoundsHomeScreen() {
	const {data,isError,isLoading,refetch} = useAvailableRounds();

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
				<Text onPress={() => refetch()} style={styles.link}>Reintentar</Text>
			</CSafeAreaView>
		);
	}

	const items = data ?? [];

	return (
		<CSafeAreaView edges={['top']} style={{backgroundColor: darkTheme.background,flex: 1}}>
			<Header title="Caminatas" />
			<FlashList
				contentContainerStyle={styles.list}
				data={items}
				estimatedItemSize={100}
				ItemSeparatorComponent={() => <View style={{height: 12}} />}
				keyExtractor={(i) => String(i.id)}
				renderItem={({item}) => <RoundCard item={item} onPress={() => { }} />}
			/>
		</CSafeAreaView>
	);
}

function RoundCard({item,onPress}: {item: RoundListItem; onPress: () => void}) {
	return (
		<TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
			<Text numberOfLines={1} style={styles.title}>{item.name}</Text>
			<View style={{height: 6}} />
			<Text style={styles.meta}>
				{new Date(item.startISO).toLocaleTimeString('es-MX',{hour: '2-digit',minute: '2-digit'})}
				{item.endISO ? ` - ${new Date(item.endISO).toLocaleTimeString('es-MX',{hour: '2-digit',minute: '2-digit'})}` : ''}
			</Text>
			<Text style={styles.meta}>{item.totalCheckpoints} checkpoints</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: darkTheme.cardBackground,
		borderColor: darkTheme.border,
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		padding: 16,
	},
	center: {alignItems: 'center',backgroundColor: darkTheme.background,flex: 1,justifyContent: 'center'},
	link: {color: darkTheme.highlight,marginTop: 8,textDecorationLine: 'underline'},
	list: {padding: 16},
	meta: {color: darkTheme.textSecondary,fontSize: 12,marginTop: 2},
	text: {color: darkTheme.textPrimary,marginTop: 8},
	title: {color: darkTheme.textPrimary,fontSize: 16,fontWeight: '600'},
});
