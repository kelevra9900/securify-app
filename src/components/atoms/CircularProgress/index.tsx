import React,{useEffect} from 'react';
import {View} from 'react-native';
import Svg,{Circle} from 'react-native-svg';
import Animated,{
	useAnimatedProps,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
	backgroundColor?: string;
	color?: string;
	duration?: number;
	progress: number;
	size?: number;
	strokeWidth?: number;
};

const CircularProgress = ({
	backgroundColor = '#E0E0E0',
	color = '#3600E0',
	duration = 1000,
	progress,
	size = 100,
	strokeWidth = 10,
}: Props) => {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;

	const animatedProgress = useSharedValue(0);

	const animatedProps = useAnimatedProps(() => {
		return {
			strokeDashoffset:
				circumference * (1 - Math.min(animatedProgress.value / 100,1)),
		};
	});

	useEffect(() => {
		animatedProgress.value = withTiming(progress,{duration});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	},[progress]);

	return (
		<View style={{height: size,width: size}}>
			<Svg height={size} width={size}>
				<Circle
					cx={size / 2}
					cy={size / 2}
					fill="none"
					r={radius}
					stroke={backgroundColor}
					strokeWidth={strokeWidth}
				/>
				<AnimatedCircle
					animatedProps={animatedProps}
					cx={size / 2}
					cy={size / 2}
					fill="none"
					r={radius}
					stroke={color}
					strokeDasharray={`${circumference}, ${circumference}`}
					strokeLinecap="round"
					strokeWidth={strokeWidth}
				/>
			</Svg>
		</View>
	);
};

export default CircularProgress;
