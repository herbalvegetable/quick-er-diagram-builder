import { useState, useEffect, useRef } from 'react';

import styles from './RelationshipLabel.module.css';

import { RelDataType, AttrType } from '@/types';

import RelationshipContextMenu from './RelationshipContextMenu';

type Props = {
	relData: RelDataType;
	relIndex: number;
	onUpdateRelationship: (index: number, updated: RelDataType) => void;
	onDeleteRelationship?: (index: number) => void;
	onEditStart?: () => void;
	onEditEnd?: () => void;
	backgroundColor: string;
	textColor: string;
	strokeColor: string;
};

export default function RelationshipLabel({
	relData,
	relIndex,
	onUpdateRelationship,
	onDeleteRelationship,
	onEditStart,
	onEditEnd,
	backgroundColor,
	textColor,
	strokeColor,
}: Props) {
	const [isEditing, setIsEditing] = useState(false);
	const prevEditingRef = useRef(false);

	useEffect(() => {
		if (isEditing && !prevEditingRef.current) onEditStart?.();
		if (!isEditing && prevEditingRef.current) onEditEnd?.();
		prevEditingRef.current = isEditing;
	}, [isEditing, onEditStart, onEditEnd]);
	const [editName, setEditName] = useState(relData.name);
	const [editAttrs, setEditAttrs] = useState<AttrType[]>(relData.attrs || []);
	const attrInputRefs = useRef<(HTMLInputElement | null)[]>([]);
	const containerRef = useRef<HTMLDivElement>(null);

	// Keep local edit buffer in sync when data changes and we're not editing
	useEffect(() => {
		if (!isEditing) {
			setEditName(relData.name);
			setEditAttrs(relData.attrs || []);
		}
	}, [relData, isEditing]);

	const handleSave = () => {
		onUpdateRelationship(relIndex, {
			...relData,
			name: editName,
			attrs: editAttrs,
		});
		setIsEditing(false);
	};

	const handleNameKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSave();
		}
	};

	const handleAttributeKeyDown = (e: React.KeyboardEvent, i: number) => {
		if (e.key === 'Tab') {
			e.preventDefault();
			setEditAttrs((prev) => {
				const newAttrs = [...prev];
				newAttrs.splice(i + 1, 0, { name: '' });
				return newAttrs;
			});
			setTimeout(() => {
				const next = attrInputRefs.current[i + 1];
				if (next) next.focus();
			}, 0);
		} else if (e.key === 'Backspace' && editAttrs[i]?.name === '') {
			e.preventDefault();
			setEditAttrs((prev) => {
				const newAttrs = [...prev];
				newAttrs.splice(i, 1);
				return newAttrs;
			});
			setTimeout(() => {
				if (i > 0) {
					const prev = attrInputRefs.current[i - 1];
					if (prev) prev.focus();
				}
			}, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			handleSave();
		}
	};

	// Context menu state
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setContextMenu({ x: e.clientX, y: e.clientY });
	};

	const labelStyle: React.CSSProperties = {
		backgroundColor,
		color: textColor,
		padding: '4px 8px',
		borderRadius: '8mm',
		fontSize: '16px',
		transform: 'translateY(-75%)',
		border: `1px solid ${strokeColor}`,
	};

	const hasAttrs = relData.attrs && relData.attrs.length > 0;

	if (!isEditing) {
		return (
			<div
				style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateY(-50%)' }}
				onDoubleClick={(e) => {
					e.stopPropagation();
					setIsEditing(true);
				}}
				onContextMenu={handleContextMenu}
			>
				{contextMenu && onDeleteRelationship && (
					<RelationshipContextMenu
						x={contextMenu.x}
						y={contextMenu.y}
						onDelete={() => onDeleteRelationship(relIndex)}
						onClose={() => setContextMenu(null)}
					/>
				)}
				{/* Attribute box above the label */}
				{hasAttrs && (
					<div className={styles.attrBox} style={{
						backgroundColor,
						color: textColor,
						border: `1px solid ${strokeColor}`,
						borderRadius: 0,
					}}>
						{relData.attrs!.map((attr, i) => (
							<span key={i} className={styles.attrName}>{attr.name}</span>
						))}
					</div>
				)}
				{/* Relationship name label */}
				<div
					style={{
						...labelStyle,
						transform: 'none',
						cursor: 'pointer',
					}}
				>
					<span style={{ cursor: 'text' }}>{relData.name}</span>
				</div>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			style={{ ...labelStyle, cursor: 'text', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}
			onBlur={(e) => {
				const related = e.relatedTarget as Node | null;
				if (!related || !e.currentTarget.contains(related)) {
					handleSave();
				}
			}}
			// Prevent the click from propagating and causing entity/canvas interactions
			onMouseDown={(e) => e.stopPropagation()}
		>
			<input
				className={styles.nameInput}
				style={{ color: textColor }}
				value={editName}
				onChange={(e) => setEditName(e.target.value)}
				onKeyDown={handleNameKeyDown}
				autoFocus
			/>
			{editAttrs.map((attr, i) => (
				<input
					key={i}
					ref={(el: HTMLInputElement | null) => { attrInputRefs.current[i] = el; }}
					className={styles.attrInput}
					style={{ color: textColor }}
					value={attr.name}
					onChange={(e) => {
						const newAttrs = [...editAttrs];
						newAttrs[i] = { ...newAttrs[i], name: e.target.value };
						setEditAttrs(newAttrs);
					}}
					onKeyDown={(e) => handleAttributeKeyDown(e, i)}
				/>
			))}
		</div>
	);
}
