import React from 'react';
import {ScrollView,StyleSheet,View} from 'react-native';

import {useTheme} from '@/context/Theme';
import {CSafeAreaView} from '@/components/atoms';
import {CheckpointList,CurrentRoundStatusCard} from '@/components/molecules';
import {PastRoundsSummaryCard} from '@/components/organisms';

const RoundsScreen = () => {
	const {theme} = useTheme();

	return (
		<CSafeAreaView edges={['top']} style={{backgroundColor: theme.background}}>
			<ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
				<View style={styles.content}>
					<CurrentRoundStatusCard
						checkpointsCompleted={3}
						remainingTime="01:30:00"
						roundName="Ronda Matutina A"
						status="active"
						totalCheckpoints={5}
					/>
					<CheckpointList />
					<PastRoundsSummaryCard
						rounds={[
							{date: '21 junio, 06:00 AM',id: '1',name: 'Ronda Matutina A',status: 'completed'},
							{date: '20 junio, 03:00 PM',id: '2',name: 'Ronda Vespertina B',status: 'incomplete'},
							{date: '19 junio, 11:00 PM',id: '3',name: 'Ronda Nocturna C',status: 'completed'},
						]}
					/>
				</View>
			</ScrollView>
		</CSafeAreaView>
	);
};

export default RoundsScreen;

const styles = StyleSheet.create({
	container: {
		paddingBottom: 60,
		paddingHorizontal: 20,
		paddingTop: 20,
	},
	content: {
		gap: 16,
	},
});
