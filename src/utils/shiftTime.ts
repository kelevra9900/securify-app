// utils/shiftTime.ts
import * as Luxon from 'luxon';
const {DateTime} = Luxon;

/** Parsea "HH:mm" o ISO a DateTime en tz; si viene ISO asume UTC → setZone(tz) */
function parseToLocal(dt: string,tz: string): Luxon.DateTime | null {
	if (!dt) {return null;}
	if (dt.includes('T')) {
		// ISO absoluto entregado en UTC desde backend
		const iso = DateTime.fromISO(dt,{zone: 'utc'}).setZone(tz);
		return iso.isValid ? iso : null;
	}
	// Fallback HH:mm (semántica hora-del-día de HOY)
	const [h,m] = dt.split(':').map(n => Number.parseInt(n,10) || 0);
	return DateTime.now().setZone(tz).startOf('day').set({hour: h,minute: m});
}

/** Devuelve etiqueta "HH:mm - HH:mm" y flag si cruza a +1 día */
export function formatShiftLabel(
	shift: {end: string; start: string;} | null,
	tz: string
): {crossesMidnight: boolean; label: string;} {
	if (!shift) {return {crossesMidnight: false,label: '—'};}

	const s = parseToLocal(shift.start,tz);
	const e = parseToLocal(shift.end,tz);
	if (!s || !e) {return {crossesMidnight: false,label: '—'};}

	const crosses = e < s; // fin ocurre “antes” que inicio -> cruza medianoche
	const startText = s.toFormat('HH:mm');
	const endText = e.toFormat('HH:mm');

	return {
		crossesMidnight: crosses,
		label: crosses ? `${startText} - ${endText} (+1d)` : `${startText} - ${endText}`,
	};
}
