import React from 'react';
import {FlatList,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {useTheme} from '@/context/Theme';
import {FileText} from 'lucide-react-native';

type Report = {
	date: string;
	id: string;
	status: 'pending' | 'resolved' | 'review';
	title: string;
};

type Props = {
	onPressReport: (id: string) => void;
	reports: Report[];
};

const statusColors: Record<Report['status'],string> = {
	pending: '#FFC107',
	resolved: '#4CAF50',
	review: '#2196F3',
};

const ReportsListCard = ({onPressReport,reports}: Props) => {
	const {theme} = useTheme();

	return (
		<View style={[styles.container,{backgroundColor: theme.cardBackground}]}>
			<Text style={[styles.title,{color: theme.textPrimary}]}>Reportes recientes</Text>

			<FlatList
				data={reports}
				keyExtractor={(item) => item.id}
				renderItem={({item}) => (
					<TouchableOpacity onPress={() => onPressReport(item.id)} style={styles.item}>
						<FileText color={theme.highlight} size={20} />
						<View style={styles.info}>
							<Text style={[styles.reportTitle,{color: theme.textPrimary}]}>
								{item.title}
							</Text>
							<Text style={[styles.reportDate,{color: theme.textSecondary}]}>
								{item.date}
							</Text>
						</View>
						<View
							style={[
								styles.statusDot,
								{backgroundColor: statusColors[item.status]},
							]}
						/>
					</TouchableOpacity>
				)}
				scrollEnabled={false}
			/>
		</View>
	);
};

export default ReportsListCard;

const styles = StyleSheet.create({
	container: {
		borderRadius: 16,
		gap: 12,
		padding: 16,
	},
	info: {
		flex: 1,
	},
	item: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 12,
		marginBottom: 16,
	},
	reportDate: {
		fontSize: 13,
		marginTop: 2,
	},
	reportTitle: {
		fontSize: 15,
		fontWeight: '600',
	},
	statusDot: {
		borderRadius: 5,
		height: 10,
		width: 10,
	},
	title: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 12,
	},
});
