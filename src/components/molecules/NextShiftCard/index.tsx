// src/components/molecules/NextShiftCard.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React,{useMemo} from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {CalendarIcon,MapPinIcon,ShieldCheckIcon} from 'lucide-react-native';
import {DateTime} from 'luxon';
import {useTheme} from '@/context/Theme';
import {TextLabel} from '@/components/atoms';
import type {AttendanceMini,Sector,Shift} from '@/types/home';

let RNLocalize: any;
try {RNLocalize = require('react-native-localize');} catch {RNLocalize = null;}

type Props = {
	attendance: AttendanceMini;
	sector?: null | Sector;
	serverTimeISO?: string;
	shift: null | Shift;
	timezone?: string;
};

type Status = 'completada' | 'en_curso' | 'pendiente';

const statusColors: Record<Status,string> = {
	completada: '#10B981',
	en_curso: '#3B82F6',
	pendiente: '#F59E0B',
};
const statusLabels: Record<Status,string> = {
	completada: 'Completada',
	en_curso: 'En curso',
	pendiente: 'Pendiente',
};

const isISO = (s?: null | string) => !!s && /T\d{2}:\d{2}/.test(s);

const NextShiftCard: React.FC<Props> = ({
	attendance,
	sector = null,
	serverTimeISO = null,
	shift,
	timezone = null,
}) => {
	const {theme} = useTheme();
	const tz = timezone || RNLocalize?.getTimeZone?.() || 'America/Mexico_City';

	const now = useMemo(
		() => (serverTimeISO ? DateTime.fromISO(serverTimeISO) : DateTime.now()).setZone(tz),
		[serverTimeISO,tz],
	);

	// Construye start/end locales desde ISO o desde "HH:mm" (para mostrar)
	const {endLocal,startLocal} = useMemo(() => {
		if (!shift) {return {endLocal: null as DateTime | null,startLocal: null as DateTime | null};}

		if (isISO(shift.start) && isISO(shift.end)) {
			const s = DateTime.fromISO(shift.start).setZone(tz);
			const e = DateTime.fromISO(shift.end).setZone(tz);
			return {endLocal: e.isValid ? e : null,startLocal: s.isValid ? s : null};
		}

		const [sH,sM] = (shift.start ?? '00:00').split(':').map(n => Number.parseInt(n,10) || 0);
		const [eH,eM] = (shift.end ?? '00:00').split(':').map(n => Number.parseInt(n,10) || 0);
		const base = now.startOf('day');
		const start = base.set({hour: sH,minute: sM});
		let end = base.set({hour: eH,minute: eM});
		if (end <= start) {end = end.plus({days: 1});}
		return {endLocal: end,startLocal: start};
	},[shift,tz,now]);

	const timeLabel = useMemo(() => {
		if (!startLocal || !endLocal) {return '—';}
		return `${startLocal.toFormat('HH:mm')} - ${endLocal.toFormat('HH:mm')}`;
	},[startLocal,endLocal]);

	const status: Status = useMemo(() => {
		if (!shift) {return 'pendiente';}

		if (typeof (shift as any).remainingMinutes === 'number') {
			const left = (shift as any).remainingMinutes as number;
			if (left <= 0) {return 'completada';}
			return attendance.checkedIn ? 'en_curso' : 'pendiente';
		}

		// Fallback si no viene remainingMinutes
		if (!startLocal || !endLocal) {return 'pendiente';}
		if (now > endLocal) {return 'completada';}
		if (now >= startLocal && now <= endLocal && attendance.checkedIn) {return 'en_curso';}
		return 'pendiente';
	},[shift,attendance.checkedIn,now,startLocal,endLocal]);

	const locationLabel = sector?.name ?? '—';
	const typeLabel = shift?.name ?? '—';

	return (
		<View style={[styles.card,{backgroundColor: theme.cardBackground}]}>
			<Text style={[styles.header,{color: theme.textPrimary}]}>Información del turno</Text>

			<View style={styles.row}>
				<CalendarIcon color={theme.textSecondary} size={20} />
				<TextLabel color={theme.textPrimary} style={styles.text} type="M14">
					{timeLabel}
				</TextLabel>
			</View>

			<View style={styles.row}>
				<MapPinIcon color={theme.textSecondary} size={20} />
				<TextLabel color={theme.textPrimary} style={styles.text} type="M14">
					{locationLabel}
				</TextLabel>
			</View>

			<View style={styles.row}>
				<ShieldCheckIcon color={theme.textSecondary} size={20} />
				<TextLabel color={theme.textPrimary} style={styles.text} type="M14">
					{typeLabel}
				</TextLabel>

				<View style={[styles.statusBadge,{backgroundColor: statusColors[status]}]}>
					<Text style={styles.statusText}>{statusLabels[status]}</Text>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		borderRadius: 16,elevation: 2,marginVertical: 10,padding: 16,shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},shadowOpacity: 0.08,shadowRadius: 4
	},
	header: {fontSize: 16,fontWeight: '600',marginBottom: 12},
	row: {alignItems: 'center',flexDirection: 'row',marginVertical: 6},
	statusBadge: {alignSelf: 'flex-start',borderRadius: 12,marginLeft: 8,paddingHorizontal: 10,paddingVertical: 4},
	statusText: {color: '#fff',fontSize: 12,fontWeight: '600'},
	text: {flex: 1,marginLeft: 10},
});

export default NextShiftCard;
