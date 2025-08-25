// src/components/atoms/Skeleton.tsx
import React from 'react';
import type {StyleProp,ViewStyle} from 'react-native';
import {StyleSheet} from 'react-native';
import {MotiView} from 'moti';

// 👇 Cambiamos string genérico por porcentaje tipado
type Percent = `${number}%`;

type BoxProps = {
	height: number;
	radius?: number;
	style?: StyleProp<ViewStyle>;     // antes: ViewStyle
	width: number | Percent;          // antes: number | string
};

export const SkeletonBox = ({height,radius = 8,style = {},width}: BoxProps) => (
	<MotiView
		animate={{opacity: 1}}
		from={{opacity: 0.5}}
		style={[styles.base,{borderRadius: radius,height,width},style]}
		transition={{duration: 900,loop: true,type: 'timing'}}
	/>
);

type CircleProps = {size: number; style?: StyleProp<ViewStyle>};
export const SkeletonCircle = ({size,style = {}}: CircleProps) => (
	<SkeletonBox height={size} radius={size / 2} style={style} width={size} />
);

const styles = StyleSheet.create({
	base: {backgroundColor: 'rgba(255,255,255,0.08)'},
});
