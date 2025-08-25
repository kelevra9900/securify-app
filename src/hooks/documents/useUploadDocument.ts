/* eslint-disable @typescript-eslint/no-explicit-any */
import {useMutation} from '@tanstack/react-query';
import {ensureSize,type LocalFile,type UploadHandle,uploadToS3} from '@/utils/s3Upload';
import {useRef,useState} from 'react';
import type {CreateMyDocumentBody,PresignPutDto} from '@/data/services/files';
import {createMyDocument,getUploadUrl} from '@/data/services/files';

type UploadInput = {
	file: LocalFile;
	meta: Omit<CreateMyDocumentBody,'filePath'>;
	onProgress?: (pct: number) => void;
};

type UploadOutput = {
	document: any;
	filePath: string;  // key en S3
};

export function useUploadDocument() {
	const [progress,setProgress] = useState<number>(0);
	const currentHandle = useRef<null | UploadHandle>(null);

	const mutation = useMutation<UploadOutput,Error,UploadInput>({
		mutationFn: async ({file,meta,onProgress}) => {
			// 1) Asegurar tamaño si no vino
			const size = file.size ?? (await ensureSize(file.path));

			// 2) Pedir upload-url al backend
			const presignBody: PresignPutDto = {
				contentLength: size,
				contentType: file.type || 'application/octet-stream',
				filename: file.name,
				// checksumSHA256: '...', // si decides firmar checksum
			};
			const presign = await getUploadUrl(presignBody);

			// 3) Subir a S3 con progreso
			const {handle,key} = await uploadToS3(file,presign,(pct) => {
				setProgress(pct);
				onProgress?.(pct);
			});
			currentHandle.current = handle;

			// 4) Crear documento en tu API
			const created = await createMyDocument({...meta,filePath: key});

			return {document: created,filePath: key};
		},
		onSettled: () => {
			currentHandle.current = null;
			setProgress(0);
		},
	});

	// Cancelación (detiene PUT en curso)
	const cancel = () => {
		currentHandle.current?.cancel();
	};

	return {
		...mutation,
		cancel,
		progress, // 0..100
	};
}
