// src/screens/RoundsHomeScreen.tsx
import type {NavigationProp} from '@react-navigation/native';
import type {RootStackParamList} from '@/navigation/types';
import type {RoundListItem} from '@/types/rounds';

import {useNavigation} from '@react-navigation/native';
import React,{useState} from 'react';
import {ActivityIndicator,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {FlashList} from '@shopify/flash-list';

import {CSafeAreaView,Header} from '@/components/atoms';
import {ActiveRoundModal} from '@/components/molecules';
import {darkTheme} from '@/assets/theme';
import {useActiveRound,useAvailableRounds} from '@/hooks/rounds';
import {Paths} from '@/navigation/paths';

export default function RoundsHomeScreen() {
	const navigation = useNavigation<NavigationProp<RootStackParamList>>();
	const {data,isError,isLoading,refetch} = useAvailableRounds();
	const {data: activeRound} = useActiveRound();
	const [showActiveRoundModal,setShowActiveRoundModal] = useState(false);

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
	const hasActiveRound = !!activeRound?.data?.id;

	const handleRoundPress = (item: RoundListItem) => {
		// Si hay una caminata activa, no permitir navegar a otra
		if (hasActiveRound) {
			setShowActiveRoundModal(true);
			return;
		}

		// Si no hay caminata activa, navegar al detalle/preview de la ronda
		navigation.navigate(Paths.PreviewRound);
	};

	return (
		<>
			<CSafeAreaView edges={['top']} style={{backgroundColor: darkTheme.background,flex: 1}}>
				<Header title="Caminatas" />
				<FlashList
					contentContainerStyle={styles.list}
					data={items}
					ItemSeparatorComponent={() => <View style={{height: 12}} />}
					keyExtractor={(i) => String(i.id)}
					renderItem={({item}) => <RoundCard
						item={item}
						onPress={() => handleRoundPress(item)}
					/>}
				/>
			</CSafeAreaView>

			{/* Modal de ronda activa */}
			<ActiveRoundModal
				activeName={activeRound?.data?.name || 'Caminata desconocida'}
				activeProgress={activeRound?.data?.progress ?
					`${activeRound.data.checkpoints?.length || 0}/${activeRound.data.progress.total || 0} checkpoints completados` :
					'Progreso no disponible'}
				onCancel={() => setShowActiveRoundModal(false)}
				onContinue={() => {
					setShowActiveRoundModal(false);
					if (activeRound?.data?.id) {
						navigation.navigate(Paths.Walk,{
							roundId: activeRound.data.id
						});
					}
				}}
				visible={showActiveRoundModal}
			/>
		</>
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
