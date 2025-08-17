/* eslint-disable @typescript-eslint/no-explicit-any */
import React,{useEffect,useMemo,useState} from 'react';
import {StyleSheet,Text,View} from 'react-native';
import * as Luxon from 'luxon';
import type {Shift} from '@/types/home';
import {darkTheme,themes} from '@/assets/theme';

const {DateTime} = Luxon;

let RNLocalize: any;
try {RNLocalize = require('react-native-localize');} catch {RNLocalize = null;}

type Props = {
	endsAtISO?: null | string;
	remainingMinutes?: null | number;
	serverTimeISO?: null | string;
	shift: null | Shift;
	timezone?: null | string;
};

const TurnCountdownCard: React.FC<Props> = ({
	endsAtISO = null,
	remainingMinutes = null,
	serverTimeISO = null,
	shift,
	timezone = null,
}) => {
	const tz =
		timezone ||
		RNLocalize?.getTimeZone?.() ||
		Intl.DateTimeFormat().resolvedOptions().timeZone ||
		'America/Mexico_City';

	// base "ahora" (si llega serverTime, mejor)
	const initialNow = useMemo(() => {
		const base = serverTimeISO ? DateTime.fromISO(serverTimeISO) : DateTime.now();
		return base.setZone(tz);
	},[serverTimeISO,tz]);

	const [now,setNow] = useState<Luxon.DateTime>(initialNow);

	useEffect(() => {setNow(initialNow);},[initialNow]);
	useEffect(() => {
		const id = setInterval(() => setNow(DateTime.now().setZone(tz)),30_000);
		return () => clearInterval(id);
	},[tz]);

	// helper: "HH:mm" -> hoy en tz
	const timeToday = (hm: string,base: Luxon.DateTime) => {
		const [H,M] = hm.split(':').map(n => Number.parseInt(n,10) || 0);
		return base.set({hour: H,millisecond: 0,minute: M,second: 0});
	};

	// Determinar endsAt (solo para mostrar la hora "Termina a las HH:mm")
	const endsAt = useMemo<Luxon.DateTime | null>(() => {
		if (endsAtISO) {
			const end = DateTime.fromISO(endsAtISO).setZone(tz);
			return end.isValid ? end : null;
		}
		if (!shift) {return null;}

		const today = now.startOf('day');
		const toDate = (val: string) =>
			val?.includes('T') ? DateTime.fromISO(val).setZone(tz) : timeToday(val,today);

		const start = toDate(shift.start);
		let end = toDate(shift.end);
		if (end <= start) {end = end.plus({days: 1});} // cruza medianoche

		return end;
	},[endsAtISO,shift,now,tz]);

	// Formatear minutos a "xh ymin"
	const fmtMinutes = (mins: number) => {
		const m = Math.max(0,Math.floor(mins));
		const h = Math.floor(m / 60);
		const r = m % 60;
		if (h <= 0) {return `${r} min`;}
		if (r <= 0) {return `${h} h`;}
		return `${h} h ${r} min`;
	};

	// Etiqueta de tiempo restante
	const remainingLabel = useMemo(() => {
		if (typeof remainingMinutes === 'number') {
			return fmtMinutes(remainingMinutes);
		}
		if (!endsAt) {return '—';}
		const diff = endsAt.diff(now,['hours','minutes']).shiftTo('minutes').minutes;
		return fmtMinutes(diff);
	},[remainingMinutes,endsAt,now]);

	const endTimeLabel = useMemo(() => (endsAt ? endsAt.toFormat('HH:mm') : '—'),[endsAt]);
	const noShift = !shift && !endsAtISO;

	return (
		<View style={[styles.card,{backgroundColor: themes.dark.cardBackground}]}>
			<Text style={[styles.title,{color: themes.dark.textPrimary}]}>
				{noShift ? 'Sin turno asignado' : 'Fin de turno en'}
			</Text>
			<Text style={[styles.time,{color: darkTheme.highlight}]}>
				{noShift ? '—' : remainingLabel}
			</Text>
			{!noShift && (
				<Text style={[styles.caption,{color: darkTheme.textSecondary}]}>
					Termina a las {endTimeLabel} ({tz})
				</Text>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	caption: {fontSize: 12,marginTop: 6,opacity: 0.9},
	card: {
		alignItems: 'center',
		borderRadius: 16,
		elevation: 2,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	time: {fontSize: 22,fontWeight: '700'},
	title: {fontSize: 14,fontWeight: '600',marginBottom: 6},
});

export default TurnCountdownCard;
