import React from 'react';
import {ScrollView,StyleSheet,View} from 'react-native';

import {useTheme} from '@/context/Theme';
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

const HomeScreen = () => {
	const {theme} = useTheme();

	return (
		<CSafeAreaView edges={['top']} style={{backgroundColor: theme.background}}>
			<ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
				<View style={styles.content}>
					<UserStatusCard />
					<UserDocumentsStatusCard />
					<TurnCountdownCard />
					<CheckpointCard />
					<SendAlertCard />
					<RecentActivityCard />
					<NextShiftCard />
					<RecentAlertsCard />
					<AnnouncementsCard />
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
