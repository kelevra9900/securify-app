// src/screens/RoundPreviewScreen.tsx
import React from 'react';
import {ActivityIndicator,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {useRoute} from '@react-navigation/native';
import {CSafeAreaView,Header} from '@/components/atoms';
import {darkTheme} from '@/assets/theme';
import {useRoundDetail,useStartRound} from '@/hooks/rounds';

export default function RoundPreviewScreen() {
	const route = useRoute<any>();
	const roundId = route.params?.roundId as number;
	const {data,isLoading} = useRoundDetail(roundId);
	const start = useStartRound();

	if (isLoading || !data) {
		return (
			<CSafeAreaView edges={['top']} style={styles.center}>
				<Header title="Resumen de caminata" />
				<ActivityIndicator color={darkTheme.highlight} />
			</CSafeAreaView>
		);
	}

	const handleStart = async () => {
		await start.mutateAsync(roundId);
	};

	return (
		<CSafeAreaView edges={['top']} style={{backgroundColor: darkTheme.background,flex: 1}}>
			<Header title="Resumen de caminata" />
			<View style={styles.container}>
				<Text style={styles.title}>{data.name}</Text>
				<Text style={styles.meta}>{data.checkpoints.length} checkpoints</Text>

				<View style={{height: 12}} />
				<FlashList
					data={data.checkpoints}
					estimatedItemSize={60}
					ItemSeparatorComponent={() => <View style={{height: 8}} />}
					keyExtractor={(c) => String(c.id)}
					renderItem={({item}) => (
						<View style={styles.cpRow}>
							<Text numberOfLines={1} style={styles.cpName}>{item.location}</Text>
							<Text style={styles.cpMeta}>({item.latitude.toFixed(4)}, {item.longitude.toFixed(4)})</Text>
						</View>
					)}
				/>

				<TouchableOpacity disabled={start.isPending} onPress={handleStart} style={styles.cta}>
					{start.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Iniciar caminata</Text>}
				</TouchableOpacity>
			</View>
		</CSafeAreaView>
	);
}

const styles = StyleSheet.create({
	center: {alignItems: 'center',backgroundColor: darkTheme.background,flex: 1,justifyContent: 'center'},
	container: {flex: 1,gap: 12,padding: 16},
	cpMeta: {color: darkTheme.textSecondary,fontSize: 12,marginTop: 2},
	cpName: {color: darkTheme.textPrimary,fontSize: 14,fontWeight: '600'},
	cpRow: {backgroundColor: darkTheme.cardBackground,borderColor: darkTheme.border,borderRadius: 10,borderWidth: StyleSheet.hairlineWidth,padding: 12},
	cta: {alignItems: 'center',backgroundColor: darkTheme.highlight,borderRadius: 12,marginTop: 12,padding: 14},
	ctaText: {color: '#fff',fontWeight: '700'},
	meta: {color: darkTheme.textSecondary},
	title: {color: darkTheme.textPrimary,fontSize: 18,fontWeight: '700'},
});
