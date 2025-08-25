import React from 'react';
import {FlatList,StyleSheet,Text,View} from 'react-native';
import {useTheme} from '@/context/Theme';
import {CheckpointItem} from '@/components/atoms';
// import {CheckpointLogModal} from '@/components/organisms';
import type {Checkpoint} from '@/types/rounds';
import type {NavigationProp} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/native';
import type {RootStackParamList} from '@/navigation/types';
import {Paths} from '@/navigation/paths';

// ⬇️ NUEVO: acepta items opcionales
type Props = {
	items?: Checkpoint[];
};


const CheckpointList = ({items = []}: Props) => {
	const {theme} = useTheme();
	const nav = useNavigation<NavigationProp<RootStackParamList>>();
	// const [selectedLog,setSelectedLog] = useState<Checkpoint | null>(null);

	return (
		<View style={[styles.container,{backgroundColor: theme.cardBackground}]}>
			<Text style={[styles.title,{color: theme.textPrimary}]}>Puntos de control</Text>

			<FlatList
				data={items}
				ItemSeparatorComponent={() => <View style={{height: 10}} />}
				keyExtractor={(item) => item.id.toString()}
				renderItem={({index,item}) => (
					<CheckpointItem
						index={index}
						name={item.location}
						onPress={() => {
							nav.navigate(Paths.PreviewRound,{
								id: item.id
							})
						}}
						status={'pending'}
					/>
				)}
				scrollEnabled={false}
			/>
			{/* 
			<CheckpointLogModal
				data={{
					checkpointName: selectedLog?.checkpointName || '',
					guardName: selectedLog?.guardName,
					status: selectedLog?.status || 'pending',
					timestamp: selectedLog?.timestamp,
				}}
				onClose={() => setSelectedLog(null)}
				visible={!!selectedLog}
			/> */}
		</View>
	);
};

export default CheckpointList;

const styles = StyleSheet.create({
	container: {borderRadius: 16,padding: 16},
	title: {fontSize: 16,fontWeight: 'bold',marginBottom: 12},
});
