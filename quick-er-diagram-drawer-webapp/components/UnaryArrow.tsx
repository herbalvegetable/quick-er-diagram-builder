import { useState, useEffect, useRef, useCallback } from 'react';

import CardinalityIcon from './CardinalityIcon';

type UnaryArrowProps = {
	entityId: string;
	strokeColor: string;
	strokeWidth?: number;
	startCardinality?: string;
	endCardinality?: string;
	unaryIndex?: number;
	unaryCount?: number;
	children?: React.ReactNode;
};

export default function UnaryArrow({
	entityId,
	strokeColor,
	strokeWidth = 3,
	startCardinality,
	endCardinality,
	unaryIndex = 0,
	unaryCount = 1,
	children,
}: UnaryArrowProps) {
	const [rect, setRect] = useState<{
		left: number; top: number; width: number; height: number;
	} | null>(null);

	const rafRef = useRef<number>(0);

	const updateRect = useCallback(() => {
		const entity = document.getElementById(entityId);
		if (!entity) return;
		const wrapper = entity.parentElement;
		if (!wrapper) return;

		setRect({
			left: wrapper.offsetLeft,
			top: wrapper.offsetTop,
			width: entity.offsetWidth,
			height: entity.offsetHeight,
		});
	}, [entityId]);

	useEffect(() => {
		updateRect();

		const entity = document.getElementById(entityId);
		if (!entity) return;
		const wrapper = entity.parentElement;
		if (!wrapper) return;

		const observer = new MutationObserver(() => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(updateRect);
		});
		observer.observe(wrapper, { attributes: true, attributeFilter: ['style'] });

		return () => {
			observer.disconnect();
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [entityId, updateRect]);

	if (!rect) return null;

	const { left, top, width, height } = rect;

	// Each additional unary loop gets progressively larger
	const baseLoopW = 150;
	const baseLoopH = 150;
	const loopStep = 60;
	const loopW = baseLoopW + unaryIndex * loopStep;
	const loopH = baseLoopH + unaryIndex * loopStep;
	const pad = 20;
	const iconSize = 28;

	// Offset anchors along the entity edges so loops don't share the same start/end point
	const anchorGap = 25;
	const startOffset = (unaryIndex - (unaryCount - 1) / 2) * anchorGap;
	const endOffset = (unaryIndex - (unaryCount - 1) / 2) * anchorGap;

	// Start point: right side of entity, vertically centred + offset
	const sx = width;
	const sy = height / 2 + startOffset;

	// End point: top side of entity, horizontally centred + offset
	const ex = width / 2 + endOffset;
	const ey = 0;

	// Cubic bezier control points
	const cp1x = sx + loopW;
	const cp1y = sy - loopH * 0.3;
	const cp2x = ex + loopW * 0.4;
	const cp2y = ey - loopH;

	// SVG container sizing
	const svgTop = cp2y - pad;
	const svgWidth = Math.max(sx, cp1x) + pad;
	const svgHeight = sy - svgTop + pad;

	// Translate curve coords into SVG-local space (svgTop is negative)
	const ly = (worldY: number) => worldY - svgTop;

	return (
		<div style={{
			position: 'absolute',
			left: left,
			top: top + svgTop,
			width: svgWidth,
			height: svgHeight,
			pointerEvents: 'none',
			zIndex: 2,
		}}>
			<svg
				width={svgWidth}
				height={svgHeight}
				style={{ overflow: 'visible' }}
			>
				<path
					d={`M ${sx} ${ly(sy)} C ${cp1x} ${ly(cp1y)}, ${cp2x} ${ly(cp2y)}, ${ex} ${ly(ey)}`}
					fill="none"
					stroke={strokeColor}
					strokeWidth={strokeWidth}
				/>
			</svg>

			{/* Start cardinality icon — at the right side of entity (start of curve) */}
			{startCardinality && (
				<svg
					style={{
						position: 'absolute',
						left: sx + 2,
						top: ly(sy) - iconSize / 2,
						overflow: 'visible',
					}}
					width={iconSize}
					height={iconSize}
					viewBox="0 0 1.5 1.5"
				>
					<CardinalityIcon
						type={startCardinality}
						fill={strokeColor}
						stroke={strokeColor}
						strokeWidth={2}
					/>
				</svg>
			)}

			{/* End cardinality icon — at the top of entity (end of curve) */}
			{endCardinality && (
				<svg
					style={{
						position: 'absolute',
						left: ex - iconSize / 2,
						top: ly(ey) - iconSize,
						overflow: 'visible',
					}}
					width={iconSize}
					height={iconSize}
					viewBox="-0.5 0 1.5 1.5"
					transform="rotate(90)"
				>
					<CardinalityIcon
						type={endCardinality}
						fill={strokeColor}
						stroke={strokeColor}
						strokeWidth={2}
					/>
				</svg>
			)}

			{/* Label at the peak of the loop */}
			{children && (
				<div style={{
					position: 'absolute',
					left: cp1x - loopW * 0.3,
					top: ly(cp2y + loopH * 0.3),
					transform: 'translate(-100%, 100%)',
					pointerEvents: 'auto',
				}}>
					{children}
				</div>
			)}
		</div>
	);
}
