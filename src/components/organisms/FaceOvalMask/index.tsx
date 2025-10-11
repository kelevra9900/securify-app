// FaceOvalMask.tsx
import React from 'react';
import {StyleSheet,useWindowDimensions,View} from 'react-native';
import Svg,{Circle,Defs,Ellipse,Mask,Rect} from 'react-native-svg';

type Props = {
	/** porcentaje del ancho/alto útil que ocupa el óvalo */
	ovalRatio?: {h: number; w: number;}; // e.g. {w:0.78, h:0.62}
	/** desplazar verticalmente el óvalo (negativo = subir) */
	offsetY?: number;
	/** dibujar dos puntos sutiles para guiar alineación de ojos */
	showEyeGuides?: boolean;
};

export default function FaceOvalMask({
	offsetY = -16,
	ovalRatio = {h: 0.60,w: 0.76},
	showEyeGuides = false,
}: Props) {
	const {height,width} = useWindowDimensions();

	const ovalW = width * ovalRatio.w;
	const ovalH = height * ovalRatio.h;
	const cx = width / 2;
	const cy = height * 0.40 + offsetY; // ligeramente arriba del centro

	const eyeOffsetX = ovalW * 0.22;
	const eyeOffsetY = ovalH * -0.06;
	const eyeR = Math.max(2.2,Math.min(3.5,width * 0.0085));

	return (
		<View pointerEvents="none" style={StyleSheet.absoluteFill}>
			<Svg height={height} width={width}>
				<Defs>
					<Mask id="mask">
						{/* Área visible (blanca) */}
						<Rect fill="white" height={height} width={width} x="0" y="0" />
						{/* El hueco (negro) donde se “abre” la cámara */}
						<Ellipse cx={cx} cy={cy} fill="black" rx={ovalW / 2} ry={ovalH / 2} />
					</Mask>
				</Defs>

				{/* Oscurece alrededor con transparencia agradable, no “bloque” */}
				<Rect
					fill="rgba(0,0,0,0.55)"
					height={height}
					mask="url(#mask)"
					width={width}
					x="0"
					y="0"
				/>

				{/* Contorno fino del óvalo */}
				<Ellipse
					cx={cx}
					cy={cy}
					fill="transparent"
					rx={ovalW / 2}
					ry={ovalH / 2}
					stroke="rgba(255,255,255,0.95)"
					strokeWidth={2}
				/>

				{/* Guías de ojos (opcionales) */}
				{showEyeGuides && (
					<>
						<Circle cx={cx - eyeOffsetX} cy={cy + eyeOffsetY} fill="rgba(255,255,255,0.9)" r={eyeR} />
						<Circle cx={cx + eyeOffsetX} cy={cy + eyeOffsetY} fill="rgba(255,255,255,0.9)" r={eyeR} />
					</>
				)}
			</Svg>
		</View>
	);
}
