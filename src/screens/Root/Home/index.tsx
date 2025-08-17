import React from 'react';
import {ActivityIndicator,ScrollView,StyleSheet,Text,View} from 'react-native';

import {CSafeAreaView} from '@/components/atoms';

import {
	AnnouncementsCard,
	CheckpointCard,
	NextShiftCard,
	RecentActivityCard,
	RecentAlertsCard,
	SendAlertCard,
	TurnCountdownCard,
	UserDocumentsStatusCard,
	UserStatusCard
} from '@/components/molecules';

import {useGetHomeData} from '@/hooks/home';
import {darkTheme} from '@/assets/theme';

const HomeScreen = () => {
	const {data,isError,isPending,refetch} = useGetHomeData();

	if (isPending) {
		return (
			<CSafeAreaView edges={['top']} style={{alignItems: 'center',backgroundColor: darkTheme.background,flex: 1,justifyContent: 'center'}}>
				<ActivityIndicator />
			</CSafeAreaView>
		);
	}

	if (isError || !data) {
		return (
			<CSafeAreaView edges={['top']} style={{alignItems: 'center',backgroundColor: darkTheme.background,flex: 1,justifyContent: 'center'}}>
				<Text style={{color: darkTheme.textPrimary,marginBottom: 12}}>No pudimos cargar Home.</Text>
				<Text onPress={() => refetch()} style={{color: darkTheme.textPrimary}}>Reintentar</Text>
			</CSafeAreaView>
		);
	}

	return (
		<CSafeAreaView edges={['top']} style={{backgroundColor: darkTheme.background}}>
			<ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
				<View style={styles.content}>

					<UserStatusCard
						fallbackAvatar={data.user.image ?? undefined}
						sector={data.sector}
						shift={data.shift}
						socketStatus="connected"
						user={data.user}
					/>

					<UserDocumentsStatusCard
						documents={data.stats.documents}
						onPress={() => {
							// navega a la pantalla de documentos, si la tienes:
							// navigation.navigate('Documents');
						}}
						progressColor={data.environment.primaryColor}
					/>

					<TurnCountdownCard
						endsAtISO={data.shift?.endsAt ?? null}
						remainingMinutes={data.shift?.remainingMinutes ?? null}
						// opcional si guardas el serverTime de la respuesta:
						// serverTimeISO={serverTime}
						shift={data.shift}
					/>

					<CheckpointCard
						checkpoint={data.lastCheckpoint}
					/>

					<SendAlertCard />
					<RecentActivityCard
						items={data.recentActivity}
						limit={4}
					/>
					<NextShiftCard
						attendance={data.stats.attendance}
						sector={data.sector}
						shift={data.shift}
					/>
					<RecentAlertsCard
						alerts={data.alerts}
						limit={5}
						onItemPress={(id) => {
							// navigation.navigate('AlertDetail', { id })
						}}
					/>
					<AnnouncementsCard
						items={data.announcements}
						// timezone="America/Mazatlan" // opcional; usa la del dispositivo por defecto
						limit={3}
						onItemPress={(id) => {
							// navigation.navigate('AnnouncementDetail', { id })
						}}
						onSeeAll={() => {
							// navigation.navigate('AnnouncementsList')
						}}
					/>
				</View>
			</ScrollView>
		</CSafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingBottom: 40,
		paddingHorizontal: 20,
	},
	content: {
		gap: 16,
	},
	header: {
		alignItems: 'center',
		marginBottom: 24,
		marginTop: 36,
	},
	subtitle: {
		fontSize: 16,
		marginTop: 8,
		opacity: 0.8,
	},
});

export default HomeScreen;
