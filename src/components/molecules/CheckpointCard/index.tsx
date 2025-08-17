// components/molecules/CheckpointCard.tsx
import React from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {MapPin} from 'lucide-react-native';
import {useTheme} from '@/context/Theme';
import type {LastCheckpoint} from '@/types/home';
import {DateTime} from 'luxon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RNLocalize: any;
try {RNLocalize = require('react-native-localize');} catch {RNLocalize = null;}

type Props = {
	checkpoint: LastCheckpoint | null | undefined;
	timezone?: string;
};

const CheckpointCard: React.FC<Props> = ({checkpoint,timezone = undefined}) => {
	const {theme} = useTheme();
	const tz = timezone || RNLocalize?.getTimeZone?.() || 'America/Mexico_City';

	const location = checkpoint?.location ?? 'Sin registro reciente';
	const whenLabel = checkpoint
		? DateTime.fromISO(checkpoint.checkedAt).setZone(tz).toRelative({style: 'short'}) ?? ''
		: '';

	return (
		<View style={[styles.card,{backgroundColor: theme.cardBackground}]}>
			<View style={styles.row}>
				<MapPin color={theme.highlight} size={20} />
				<Text style={[styles.label,{color: theme.textPrimary}]}>Último checkpoint</Text>
			</View>

			<Text numberOfLines={2} style={[styles.location,{color: theme.textSecondary}]}>
				{location}
			</Text>

			{!!whenLabel && (
				<Text style={[styles.time,{color: theme.textSecondary}]}>
					{whenLabel} ({tz})
				</Text>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		borderRadius: 16,
		elevation: 2,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	label: {fontSize: 14,fontWeight: '600'},
	location: {fontSize: 16},
	row: {alignItems: 'center',flexDirection: 'row',gap: 8,marginBottom: 8},
	time: {fontSize: 12,marginTop: 6},
});

export default CheckpointCard;
