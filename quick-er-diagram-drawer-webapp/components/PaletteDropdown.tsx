import React, { useState, useEffect, useRef } from 'react';

import styles from './PaletteDropdown.module.css';

import { colourPalettes } from '@/lib/colourPalette';

type Props = {
	selectedPaletteId: string;
	onSelectPalette: (id: string) => void;
};

export default function PaletteDropdown({ selectedPaletteId, onSelectPalette }: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

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

	return (
		<div className={styles.paletteMenu}>
			<button
				ref={buttonRef}
				type="button"
				className={styles.paletteButton}
				onClick={() => setIsOpen((open) => !open)}
				title="Change colour palette"
			>
				🎨
			</button>
			{
				isOpen && (
					<div ref={dropdownRef} className={styles.paletteDropdown}>
						{colourPalettes.map((palette) => (
							<button
								key={palette.id}
								type="button"
								className={styles.paletteOption}
								onClick={() => {
									onSelectPalette(palette.id);
									setIsOpen(false);
								}}
							>
								<span>
									{palette.name}
									{palette.id === selectedPaletteId ? ' ✓' : ''}
								</span>
								<span
									className={styles.paletteSwatch}
									style={{
										background: `linear-gradient(90deg, ${palette.background} 0%, ${palette.entityFill} 100%)`,
									}}
								/>
							</button>
						))}
					</div>
				)
			}
		</div>
	);
}
