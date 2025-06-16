import React,{useState} from 'react';
import {LoginTemplate} from '@/components/templates';
import {LoginSteps} from '@/components/organisms';
import type {RootScreenProps} from '@/navigation/types';
import {Paths} from '@/navigation/paths';

const LoginScreen = ({navigation}: RootScreenProps<Paths.Login>) => {
	const [step,setStep] = useState<'camera' | 'error' | 'loading' | 'success' | 'welcome'>('welcome');

	const handleTakePhoto = () => {
		setStep('loading');
		setTimeout(() => {
			const success = Math.random() > 0.3;
			setStep(success ? 'success' : 'error');
		},2000);
	};

	return (
		<LoginTemplate>
			<LoginSteps
				onCancel={() => setStep('welcome')}
				onContinue={() => navigation.navigate(Paths.TabBarNavigation)}
				onRetry={() => setStep('camera')}
				onStart={() => setStep('camera')}
				onTakePhoto={handleTakePhoto}
				step={step}
			/>
		</LoginTemplate>
	);
};

export default LoginScreen;
