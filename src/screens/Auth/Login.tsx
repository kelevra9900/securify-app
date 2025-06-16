import React,{useState} from 'react';
import {LoginTemplate} from '@/components/templates';
import {LoginSteps} from '@/components/organisms';

const LoginScreen = () => {
	const [step,setStep] = useState<'welcome' | 'camera' | 'loading' | 'success' | 'error'>('welcome');

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
				step={step}
				onStart={() => setStep('camera')}
				onTakePhoto={handleTakePhoto}
				onRetry={() => setStep('camera')}
				onCancel={() => setStep('welcome')}
			/>
		</LoginTemplate>
	);
};

export default LoginScreen;
