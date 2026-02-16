import { useState, useEffect, useRef } from 'react';
import { RxHamburgerMenu } from 'react-icons/rx';
import { VscFile } from 'react-icons/vsc';
import { RxImage } from 'react-icons/rx';
import { MdTextSnippet, MdUploadFile } from 'react-icons/md';

import styles from './SettingsDropdown.module.css';

import { handleExportPDF, handleExportPNG } from '@/util/handleExport';
import { createDiagramCode } from '@/util/extractCode';
import { EntityDataType, RelDataType } from '@/types';

type Props = {
	canvasRef: React.RefObject<HTMLDivElement | null>;
	entitiesData: EntityDataType[];
	relsData: RelDataType[];
	onLoadDiagramFile: (fileContent: string) => void;
};

export default function SettingsDropdown({ canvasRef, entitiesData, relsData, onLoadDiagramFile }: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as Node;
			if (
				buttonRef.current && !buttonRef.current.contains(target) &&
				dropdownRef.current && !dropdownRef.current.contains(target)
			) {
				setIsOpen(false);
			}
		};
		window.addEventListener('mousedown', handleClickOutside);
		return () => window.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen]);

	const onExportPDF = async () => {
		setIsOpen(false);
		const canvas = canvasRef.current;
		if (canvas) {
			await handleExportPDF(canvas);
		}
	};

	const onExportPNG = async () => {
		setIsOpen(false);
		const canvas = canvasRef.current;
		if (canvas) {
			await handleExportPNG(canvas);
		}
	};

	const onExportDiagramCode = () => {
		setIsOpen(false);
		const code = createDiagramCode(entitiesData, relsData);
		const blob = new Blob([code], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'diagram.txt';
		a.click();
		URL.revokeObjectURL(url);
	};

	const onLoadDiagramCode = () => {
		setIsOpen(false);
		fileInputRef.current?.click();
	};

	const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const content = reader.result as string;
			onLoadDiagramFile(content);
		};
		reader.readAsText(file);
		// Reset so the same file can be re-selected
		e.target.value = '';
	};

	return (
		<div className={styles.settingsMenu}>
			<button
				ref={buttonRef}
				type="button"
				className={styles.settingsButton}
				onClick={() => setIsOpen((open) => !open)}
				title="Settings"
			>
				<RxHamburgerMenu />
			</button>
			{/* Hidden file input for Load Diagram Code */}
			<input
				ref={fileInputRef}
				type="file"
				accept=".txt"
				style={{ display: 'none' }}
				onChange={handleFileSelected}
			/>
			{isOpen && (
				<div ref={dropdownRef} className={styles.settingsDropdown}>
					<button
						className={styles.menuItem}
						onClick={onExportPDF}
					>
						<span className={styles.menuIcon}><VscFile /></span>
						Export as PDF
					</button>
					<button
						className={styles.menuItem}
						onClick={onExportPNG}
					>
						<span className={styles.menuIcon}><RxImage /></span>
						Export as PNG
					</button>
					<button
						className={styles.menuItem}
						onClick={onExportDiagramCode}
					>
						<span className={styles.menuIcon}><MdTextSnippet /></span>
						Export as Diagram Code
					</button>
					<button
						className={styles.menuItem}
						onClick={onLoadDiagramCode}
					>
						<span className={styles.menuIcon}><MdUploadFile /></span>
						Load Diagram Code
					</button>
				</div>
			)}
		</div>
	);
}
