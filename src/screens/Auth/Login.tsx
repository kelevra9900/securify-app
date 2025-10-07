import React,{useState} from 'react';
import {LoginTemplate} from '@/components/templates';
import {LoginSteps} from '@/components/organisms';
import type {RootScreenProps} from '@/navigation/types';
import {Paths} from '@/navigation/paths';

const LoginScreen = ({navigation}: RootScreenProps<Paths.Login>) => {
	const [step,setStep] = useState<'camera' | 'error' | 'loading' | 'success' | 'welcome'>('welcome');

	const handleTakePhoto = () => {
		setStep('loading');
		if (__DEV__) {
			navigation.navigate(Paths.LoginWithCredentials)
		} else {
			navigation.navigate(Paths.FaceCamera)
		}
	};

	return (
		<LoginTemplate>
			<LoginSteps
				onCancel={() => setStep('welcome')}
				onContinue={() => navigation.navigate(Paths.SectorSelector)}
				onRetry={() => setStep('camera')}
				onStart={() => setStep('camera')}
				onTakePhoto={handleTakePhoto}
				step={step}
			/>
		</LoginTemplate>
	);
};

export default LoginScreen;
