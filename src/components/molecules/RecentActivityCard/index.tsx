/* eslint-disable @typescript-eslint/no-explicit-any */
// components/molecules/RecentActivityCard.tsx
import React,{useMemo} from 'react';
import {FlatList,StyleSheet,Text,View} from 'react-native';
import {useTheme} from '@/context/Theme';
import type {ActivityItem,AlertStatus} from '@/types/home';
import {DateTime} from 'luxon';
import {
	AlertCircleIcon,
	ArrowLeftRightIcon,
	LogInIcon,
	LogOutIcon,
} from 'lucide-react-native';

// RNLocalize es opcional
let RNLocalize: any;
try {RNLocalize = require('react-native-localize');} catch {RNLocalize = null;}

type Props = {
	items: ActivityItem[] | undefined;
	/** IANA timezone; si no se pasa, se usa la del dispositivo */
	timezone?: string;
	/** Máximo de filas a mostrar (por si quieres truncar) */
	limit?: number;
	/** Mensaje vacío */
	emptyText?: string;
};

const iconByType = (
	type: AlertStatus,
	colorAlert: string,
	colorIn: string,
	colorOut: string,
	colorChange: string,
) => {
	switch (type) {
		case 'CREATED':
			return <AlertCircleIcon color={colorAlert} size={20} />;
		case 'FALSE_ALARM':
			return <LogInIcon color={colorIn} size={20} />;
		case 'REJECTED':
			return <LogInIcon color={colorIn} size={20} />;
		case 'SOLVED':
			return <LogOutIcon color={colorOut} size={20} />;
		case 'UNDER_REVIEW':
			return <LogInIcon color={colorIn} size={20} />;
		default:
			return <ArrowLeftRightIcon color={colorChange} size={20} />;
	}
};

const RecentActivityCard: React.FC<Props> = ({
	emptyText = 'Sin actividad reciente',
	items,
	limit = undefined,
	timezone = undefined,
}) => {
	const {theme} = useTheme();
	const tz = timezone || RNLocalize?.getTimeZone?.() || 'America/Mexico_City';

	const data = useMemo(() => {
		const list = Array.isArray(items) ? items : [];
		return typeof limit === 'number' ? list.slice(0,limit) : list;
	},[items,limit]);

	const renderItem = ({index,item}: {index: number; item: ActivityItem;}) => {
		// relativo corto en la IANA dada (es-MX)
		const rel = DateTime.fromISO(item.timestamp)
			.setZone(tz)
			.setLocale('es')
			.toRelative({style: 'short'}) ?? '';

		// una descripción corta basada en meta (fallback al title)
		let description = '';
		if (item.type === 'SOLVED' && item.meta) {
			const fromId = (item.meta as any).fromSectorId ?? '—';
			const toId = (item.meta as any).toSectorId ?? '—';
			description = `Sector ${fromId} → ${toId}`;
		} else if (item.type === 'CREATED' && item.meta) {
			const st = (item.meta as any).status ?? '';
			const id = (item.meta as any).alertId ? `#${(item.meta as any).alertId}` : '';
			description = [st,id].filter(Boolean).join(' ');
		} else {
			description = '';
		}

		return (
			<View style={styles.item}>
				<View style={styles.icon}>
					{iconByType(
						item.type,
						'#E94560',         // alert
						'#5CE27F',         // check in
						'#FFC107',         // check out
						theme.highlight,   // sector change
					)}
				</View>
				<View style={styles.content}>
					<Text numberOfLines={1} style={[styles.title,{color: theme.textPrimary}]}>
						{item.title}
					</Text>
					{!!description && (
						<Text numberOfLines={1} style={[styles.description,{color: theme.textSecondary}]}>
							{description}
						</Text>
					)}
				</View>
				<Text style={[styles.time,{color: theme.textSecondary}]}>{rel}</Text>
			</View>
		);
	};

	return (
		<View style={[styles.card,{backgroundColor: theme.cardBackground}]}>
			<Text style={[styles.header,{color: theme.textPrimary}]}>Actividad reciente</Text>
			{data.length === 0 ? (
				<Text style={{color: theme.textSecondary,fontSize: 13}}>{emptyText}</Text>
			) : (
				<FlatList
					data={data}
					ItemSeparatorComponent={() => <View style={styles.separator} />}
					keyExtractor={(item,i) => `${item.type}-${item.timestamp}-${i}`}
					renderItem={renderItem}
					scrollEnabled={false}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		borderRadius: 16,
		elevation: 2,
		marginTop: 16,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		width: '100%',
	},
	content: {flex: 1},
	description: {fontSize: 13,marginTop: 2},
	header: {fontSize: 16,fontWeight: '600',marginBottom: 12},
	icon: {marginRight: 12},
	item: {alignItems: 'center',flexDirection: 'row'},
	separator: {height: 12},
	time: {fontSize: 12,marginLeft: 8},
	title: {fontSize: 14,fontWeight: '600'},
});

export default RecentActivityCard;
