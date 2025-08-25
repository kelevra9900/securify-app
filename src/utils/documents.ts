import {FileAudio,FileImage,FileText,FileVideo} from "lucide-react-native";

export function getFileNameFromPath(path?: null | string) {
	if (!path) {return 'documento';}
	const last = path.split('/').pop() || path;
	// quita prefijo de timestamp: "1692751111111-nombre.pdf" -> "nombre.pdf"
	return last.replace(/^\d{10,}-/,'');
}
export function getExtFromName(name: string) {
	const m = name.match(/\.([\da-z]+)$/i);
	return (m?.[1] ?? '').toUpperCase();
}

export function pickFileIcon(ext: string) {
	if (/^(png|jpe?g|webp|heic|svg)$/i.test(ext)) {return FileImage;}
	if (/^(mp4|mov|mkv|webm)$/i.test(ext)) {return FileVideo;}
	if (/^(mp3|aac|wav|flac)$/i.test(ext)) {return FileAudio;}
	if (/^(pdf|docx?|xlsx?|pptx?)$/i.test(ext)) {return FileText;}
	return File;
}