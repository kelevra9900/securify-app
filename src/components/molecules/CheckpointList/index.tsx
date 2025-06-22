// CheckpointList.tsx
import React,{useState} from 'react';
import {FlatList,StyleSheet,Text,View} from 'react-native';

import {useTheme} from '@/context/Theme';
import {CheckpointItem} from '@/components/atoms';
import {CheckpointLogModal} from '@/components/organisms';
import type {CheckpointLog} from '@/types/checkpoint';

const MOCK_CHECKPOINTS: CheckpointLog[] = [
	{
		checkpointId: 'CP-001',
		checkpointName: 'Zona A',
		guardId: 'GUARD-123',
		guardName: 'Juan Pérez',
		id: '1',
		status: 'pending',
		timestamp: new Date().toISOString(),
	},
	{
		checkpointId: 'CP-002',
		checkpointName: 'Zona B',
		guardId: 'GUARD-123',
		guardName: 'Juan Pérez',
		id: '2',
		status: 'completed',
		timestamp: new Date().toISOString(),
	},
	{
		checkpointId: 'CP-003',
		checkpointName: 'Zona C',
		guardId: 'GUARD-123',
		guardName: 'Juan Pérez',
		id: '3',
		status: 'pending',
		timestamp: new Date().toISOString(),
	},
];

const CheckpointList = () => {
	const {theme} = useTheme();
	const [selectedLog,setSelectedLog] = useState<CheckpointLog | null>(null);

	return (
		<View style={[styles.container,{backgroundColor: theme.cardBackground}]}>
			<Text style={[styles.title,{color: theme.textPrimary}]}>Puntos de control</Text>

			<FlatList
				data={MOCK_CHECKPOINTS}
				ItemSeparatorComponent={() => <View style={{height: 10}} />}
				keyExtractor={(item) => item.id}
				renderItem={({index,item}) => (
					<CheckpointItem
						index={index}
						name={item.checkpointName}
						onPress={() => setSelectedLog(item)}
						status={item.status}
					/>
				)}
				scrollEnabled={false}
			/>

			<CheckpointLogModal
				data={{
					checkpointName: selectedLog?.checkpointName || '',
					guardName: selectedLog?.guardName,
					status: selectedLog?.status || 'pending',
					timestamp: selectedLog?.timestamp,
				}}
				onClose={() => setSelectedLog(null)}
				visible={!!selectedLog}
			/>
		</View>
	);
};

export default CheckpointList;

const styles = StyleSheet.create({
	container: {
		borderRadius: 16,
		padding: 16,
	},
	title: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 12,
	},
});
