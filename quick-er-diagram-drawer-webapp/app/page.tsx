'use client';
import React, { useState, useEffect, useContext, useRef, useMemo, useCallback } from 'react';
import Xarrow, { Xwrapper } from 'react-xarrows';

import styles from './page.module.css';

import Entity from '@/components/Entity';
import CommandPrompt from '@/components/CommandPrompt';
import CardinalityIcon from '@/components/CardinalityIcon';
import DoubleArrow from '@/components/DoubleArrow';

import { useCameraPositionContext } from '@/context/CameraPositionProvider';

import { EntityDataType, RelDataType } from '@/types';

import { extractDiagramCode, createDiagramCode } from '@/util/extractCode';
import { calculateSmartAnchors } from '@/util/getWithOffsets';
import { capitaliseFirstLetter } from '@/util/strings';
import {
	identifyAllRelationshipsForEntityDeletion,
	identifyAssociatedConnectorForSuperEntity,
} from '@/util/identifyAssociatedRelationshipsForEntity';
import { getDiagramPrettyLayout } from '@/util/getDiagramPrettyLayout';

import { colourPalettes } from '@/lib/colourPalette';
import PaletteDropdown from '@/components/PaletteDropdown';

const PALETTE_STORAGE_KEY = 'er-diagram-palette-id';
const DIAGRAM_CODE_STORAGE_KEY = 'er-diagram-code';

function getStoredPaletteId(): string | undefined {
	if (typeof window === 'undefined') return undefined;
	const stored = localStorage.getItem(PALETTE_STORAGE_KEY);
	if (!stored) return undefined;
	return colourPalettes.some(p => p.id === stored) ? stored : undefined;
}
import CommandErrorToast from '@/components/CommandErrorToast';
import SettingsDropdown from '@/components/SettingsDropdown';
import RelationshipLabel from '@/components/RelationshipLabel';
import UnaryArrow from '@/components/UnaryArrow';
import HelpModal from '@/components/HelpModal';

export default function Home() {
	const { cameraPos, setCameraPos } = useCameraPositionContext();

	const [entitiesData, setEntitiesData] = useState<EntityDataType[]>([]);
	const [selectedPaletteId, setSelectedPaletteId] = useState(colourPalettes[0]?.id);

	// Load stored palette on mount (client-side only; localStorage unavailable during SSR)
	useEffect(() => {
		const stored = getStoredPaletteId();
		if (stored) setSelectedPaletteId(stored);
	}, []);

	const handleSelectPalette = useCallback((id: string) => {
		setSelectedPaletteId(id);
		localStorage.setItem(PALETTE_STORAGE_KEY, id);
	}, []);
	const [activeEntityId, setActiveEntityId] = useState<string | null>(null);
	const [showHelp, setShowHelp] = useState(false);
	const canvasRef = useRef<HTMLDivElement>(null);
	const currentPalette = colourPalettes.find(p => p.id === selectedPaletteId) ?? colourPalettes[0];

	const initEntitiesData = (data: EntityDataType[]): RelDataType[] => {
		// sort entities to find super types first before subtypes
		data = data.sort((e1, e2) => {
			// order supers before subs
			if (e1.type === "super" && e2.type !== "super") {
				return -1; // e1 comes first
			}
			if (e2.type === "super" && e1.type !== "super") {
				return 1; // e2 comes first
			}
			if (e1.type === "sub" && e2.type !== "sub") {
				return 1; // e1 comes after
			}
			if (e2.type === "sub" && e1.type !== "sub") {
				return -1; // e2 comes after
			}

			return 0;
		});
		console.log("Sorted entities: ", data);

		// extract super entities, create rels for supers and their subs
		let extraRels: RelDataType[] = [];
		let superConnectors: EntityDataType[] = [];
		let supers: EntityDataType[] = [];
		for (let curr of data) {
			if (curr.type == 'super') {
				supers.push(curr);
				console.log("pushed super entity: ", curr.name);

				// create new SupertypeConnector draggable component on canvas
				let connector: EntityDataType = {
					name: curr.name,
					type: 'connector',
					options: [...curr.options!],
				}
				superConnectors.push(connector);

				// create rel arrow to from parent to connector
				let currId = `entity:${curr.name.toLowerCase()}`;
				let connectorId = `connector:${curr.name.toLowerCase()}`;
				let isDisjoint = curr.options![1] == 'disjoint';
				let discriminatorAttr = curr.attrs!.at(-1)?.name;
				let relName = `${isDisjoint ? discriminatorAttr : discriminatorAttr?.split("(")[0]}${isDisjoint ? "=" : ":"}`;
				let rel: RelDataType = {
					name: relName || "",
					type: `${curr.options![0] == 'total' ? "double" : "single"}Headless`,
					arrows: [
						{ from: currId, to: connectorId, cardinality: "01" },
						{ from: connectorId, to: currId, cardinality: "01" },
					],
				}
				extraRels.push(rel);

				console.log("After super entity: ", supers, extraRels);
			}
			if (curr.type == 'sub') {
				console.log('SUB finds parent: ', supers, curr.options);
				const parent = supers.filter(ent => ent.name.toLowerCase() == curr.options![0].toLowerCase())[0];

				if (parent) {
					let currId = `entity:${curr.name.toLowerCase()}`;
					let connectorId = `connector:${parent.name.toLowerCase()}`;
					let rel: RelDataType = {
						name: parent.options![1] == 'disjoint' ? curr.name.toUpperCase() : `${capitaliseFirstLetter(curr.name)}? = \'Yes\'`,
						type: 'singleHeadless',
						arrows: [
							{ from: connectorId, to: currId, cardinality: "01" },
							{ from: currId, to: connectorId, cardinality: "01" },
						],
					}
					extraRels.push(rel);
				}
			}
		}

		// ultimately push all entities into entitiesData list
		setEntitiesData([...data, ...superConnectors]);

		// return additional relationship arrows for supers and subs
		return extraRels;
	}

	// Like initEntitiesData but appends to existing entitiesData instead of replacing
	const initEntitiesDataAppend = (data: EntityDataType[]): RelDataType[] => {
		data = data.sort((e1, e2) => {
			if (e1.type === "super" && e2.type !== "super") return -1;
			if (e2.type === "super" && e1.type !== "super") return 1;
			if (e1.type === "sub" && e2.type !== "sub") return 1;
			if (e2.type === "sub" && e1.type !== "sub") return -1;
			return 0;
		});

		let extraRels: RelDataType[] = [];
		let superConnectors: EntityDataType[] = [];
		let supers: EntityDataType[] = [];
		for (let curr of data) {
			if (curr.type == 'super') {
				supers.push(curr);
				let connector: EntityDataType = {
					name: curr.name,
					type: 'connector',
					options: [...curr.options!],
				}
				superConnectors.push(connector);

				let currId = `entity:${curr.name.toLowerCase()}`;
				let connectorId = `connector:${curr.name.toLowerCase()}`;
				let isDisjoint = curr.options![1] == 'disjoint';
				let discriminatorAttr = curr.attrs!.at(-1)?.name;
				let relName = `${isDisjoint ? discriminatorAttr : discriminatorAttr?.split("(")[0]}${isDisjoint ? "=" : ":"}`;
				let rel: RelDataType = {
					name: relName || "",
					type: `${curr.options![0] == 'total' ? "double" : "single"}Headless`,
					arrows: [
						{ from: currId, to: connectorId, cardinality: "01" },
						{ from: connectorId, to: currId, cardinality: "01" },
					],
				}
				extraRels.push(rel);
			}
			if (curr.type == 'sub') {
				const parent = supers.filter(ent => ent.name.toLowerCase() == curr.options![0].toLowerCase())[0];
				if (parent) {
					let currId = `entity:${curr.name.toLowerCase()}`;
					let connectorId = `connector:${parent.name.toLowerCase()}`;
					let rel: RelDataType = {
						name: parent.options![1] == 'disjoint' ? curr.name.toUpperCase() : `${capitaliseFirstLetter(curr.name)}? = \'Yes\'`,
						type: 'singleHeadless',
						arrows: [
							{ from: connectorId, to: currId, cardinality: "01" },
							{ from: currId, to: connectorId, cardinality: "01" },
						],
					}
					extraRels.push(rel);
				}
			}
		}

		// Append new entities + connectors to existing entitiesData
		setEntitiesData((prev) => [...prev, ...data, ...superConnectors]);

		return extraRels;
	}

	const entityRefs = useRef<Map<string, HTMLDivElement>>(new Map());
	const addEntity = (entity: EntityDataType) => {
		let newData = [...entitiesData];
		newData.push(entity);
		setEntitiesData(newData);
	}

	const updateEntityAtIndex = (index: number, updated: EntityDataType) => {
		setEntitiesData((prev) => {
			const next = [...prev];
			next[index] = updated;
			return next;
		});
	};

	const deleteEntityAtIndex = (index: number) => {
		const entity = entitiesData[index];
		if (!entity) return;

		// Collect all relationship indices to remove (including connector rels for supers)
		const relIndicesToRemove = identifyAllRelationshipsForEntityDeletion(
			entity, entitiesData, relsData
		);
		if (relIndicesToRemove.length > 0) {
			const removeSet = new Set(relIndicesToRemove);
			setRelsData((prev) => prev.filter((_, i) => !removeSet.has(i)));
		}

		// Collect entity indices to remove
		const entityIndicesToRemove = new Set<number>([index]);

		// If this is a super entity, also remove its connector
		if (entity.type === 'super') {
			const connectorIdx = identifyAssociatedConnectorForSuperEntity(entity, entitiesData);
			if (connectorIdx !== -1) {
				entityIndicesToRemove.add(connectorIdx);
			}
		}

		setEntitiesData((prev) => prev.filter((_, i) => !entityIndicesToRemove.has(i)));
	};

	const [relsData, setRelsData] = useState<RelDataType[]>([]);
	const addRelationship = (relationship: RelDataType) => {
		let newData = [...relsData];
		newData.push(relationship);
		setRelsData(newData);
	}

	const updateRelationshipAtIndex = (index: number, updated: RelDataType) => {
		setRelsData((prev) => {
			const next = [...prev];
			next[index] = updated;
			return next;
		});
	};

	const deleteRelationshipAtIndex = useCallback((index: number) => {
		setRelsData((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const diagramLoadedRef = useRef(false);

	// Load diagram on mount: localStorage first, else fetch from server
	useEffect(() => {
		const stored = typeof window !== 'undefined' ? localStorage.getItem(DIAGRAM_CODE_STORAGE_KEY) : null;
		if (stored && stored.trim().length > 0) {
			const { entities, relationships } = extractDiagramCode(stored);
			const extraRels = initEntitiesData(entities ?? []);
			setRelsData([...(relationships ?? []), ...extraRels]);
			if(entities?.length === 0 && relationships?.length === 0){
				console.log("No diagram code found in localStorage, fetch template from server.");
			}
			else{
				pendingPrettyFormatRef.current = true;
				diagramLoadedRef.current = true;
				return;
			}
			
		}
		fetch(`http://localhost:5000/test_diagram.txt`)
			.then(res => res.text().then(data => {
				console.log(data);
				let { entities, relationships } = extractDiagramCode(data);
				let extraRels: RelDataType[] = initEntitiesData(entities!);
				let allRels = [...relationships!, ...extraRels];
				setRelsData(allRels);
				pendingPrettyFormatRef.current = true;
				diagramLoadedRef.current = true;
			}))
			.catch(err => console.log(err));
	}, []);

	// Persist diagram to localStorage when it changes (after initial load)
	useEffect(() => {
		if (!diagramLoadedRef.current) return;
		const code = createDiagramCode(entitiesData, relsData);
		localStorage.setItem(DIAGRAM_CODE_STORAGE_KEY, code);
	}, [entitiesData, relsData]);

	useEffect(() => {
		console.log("EntitiesData: ", entitiesData);
		console.log("RelationshipsData: ", relsData);
	}, [entitiesData, relsData]);

	const cameraPosRef = useRef(cameraPos);
	const dragAnchorRef = useRef(cameraPos);

	const requestRef = useRef<number>(0);

	const mouseRef: React.RefObject<any> = useRef({
		left: false,
		middle: false,
		right: false,
	});
	const mouseOriginPosRef = useRef([0, 0]);

	const [deltaPos, setDeltaPos] = useState([0, 0]);

	const setMouseDown = (buttonId: number, isDown: boolean) => {
		const buttons: string[] = ['left', 'middle', 'right'];
		mouseRef.current[buttons[buttonId]] = isDown;
	}
	const setMouseOriginPos = (pos: any) => { mouseOriginPosRef.current = pos };

	useEffect(() => {
		const onMouseDown = (e: any) => {
			console.log('Mousedown: ', e.button);
			if (e.button >= 0 && e.button <= 2) {
				setMouseOriginPos([e.clientX, e.clientY]);
				setDeltaPos([0, 0]);
				setMouseDown(e.button, true);
			}
			if (e.button == 1) {
				setMouseOriginPos([e.clientX, e.clientY]);
				console.log('Current origin: ', mouseOriginPosRef.current);

				dragAnchorRef.current = cameraPosRef.current;
			}
		};
		const onMouseUp = (e: any) => {
			// console.log('Mouseup: ', cameraPos);
			if (e.button >= 0 && e.button <= 2) {
				setMouseDown(e.button, false);
			}
		}
		const onMouseMove = (e: any) => {

			if (mouseRef.current.middle) {
				// console.log(mouseRef.current);
				let [origX, origY] = mouseOriginPosRef.current;
				let [dragAnchorX, dragAnchorY] = dragAnchorRef.current;

				let newX = dragAnchorX + (e.clientX - origX);
				let newY = dragAnchorY + (e.clientY - origY);

				setCameraPos([newX, newY]);
			}
			else if (mouseRef.current.left) {
				let [origX, origY] = mouseOriginPosRef.current;

				// deltaRef.current[0] = origX - e.clientX;
				// deltaRef.current[1] = origY - e.clientY;
				// console.log('Delta Ref: ', deltaRef.current);

				const newX = origX - e.clientX;
				const newY = origY - e.clientY;

				if (requestRef.current) cancelAnimationFrame(requestRef.current);

				requestRef.current = requestAnimationFrame(() => {
					setDeltaPos([newX, newY]);
				});
			}
		}

		window.addEventListener('mousedown', onMouseDown);
		window.addEventListener('mouseup', onMouseUp);
		window.addEventListener('mousemove', onMouseMove);

		return () => {
			window.removeEventListener('mousedown', onMouseDown);
			window.removeEventListener('mouseup', onMouseUp);
			window.removeEventListener('mousemove', onMouseMove);
		}
	}, []);

	useEffect(() => {
		cameraPosRef.current = cameraPos;
	}, [cameraPos]);

	// Load a full diagram (entities + relationships) onto the canvas,
	// appending to the existing elements rather than replacing them
	const loadDiagramToCanvas = (data: { entities?: EntityDataType[], relationships?: RelDataType[] }) => {
		const { entities, relationships } = data;
		if (entities && entities.length > 0) {
			// Filter out entities that already exist on the canvas
			const existingNames = new Set(
				entitiesData.map((e) => e.name.toLowerCase())
			);
			const newEntities = entities.filter(
				(e) => !existingNames.has(e.name.toLowerCase())
			);

			if (newEntities.length > 0) {
				// Process super/sub hierarchy for the new entities
				const extraRels = initEntitiesDataAppend(newEntities);
				// Append new relationships (from AI + super/sub connectors) to existing ones
				setRelsData((prev) => [...prev, ...(relationships ?? []), ...extraRels]);
				pendingPrettyFormatRef.current = true;
			} else {
				// No new entities, but still append any new relationships
				if (relationships && relationships.length > 0) {
					setRelsData((prev) => [...prev, ...relationships]);
				}
			}
		}
	};

	// CommandPrompt code
	const addObjectToCanvas = (objData: { objType: string, obj: EntityDataType | RelDataType | null }) => {
		if (objData.obj === null) return;

		switch (objData.objType) {
			case 'entity': {
				const newEntity = objData.obj as EntityDataType;
				const duplicate = entitiesData.some(
					(e) => e.name.toLowerCase() === newEntity.name.toLowerCase() && e.type !== 'connector'
				);
				if (duplicate) {
					throw new Error(`An entity named "${newEntity.name}" already exists.`);
				}
				addEntity(newEntity);
				console.log(newEntity);
				break;
			}
			case 'relationship':
				addRelationship(objData.obj as RelDataType);
				break;
		}
	}

	// Load diagram from file content — overwrites all current entities and relationships
	const handleLoadDiagramFile = useCallback((fileContent: string) => {
		const { entities, relationships } = extractDiagramCode(fileContent);
		const extraRels = initEntitiesData(entities ?? []);
		setRelsData([...(relationships ?? []), ...extraRels]);
		pendingPrettyFormatRef.current = true;
	}, []);

	// Pretty Format layout
	const [entityLayoutPositions, setEntityLayoutPositions] = useState<number[][] | null>(null);
	const pendingPrettyFormatRef = useRef(false);

	const handlePrettyFormat = useCallback(() => {
		if (entitiesData.length === 0) return;
		const positions = getDiagramPrettyLayout(entitiesData, relsData, cameraPosRef.current);
		setEntityLayoutPositions(positions);
	}, [entitiesData, relsData]);

	// Auto pretty-format after bulk loads (initial, file upload, AI generation)
	useEffect(() => {
		if (pendingPrettyFormatRef.current && entitiesData.length > 0) {
			pendingPrettyFormatRef.current = false;
			handlePrettyFormat();
		}
	}, [entitiesData, relsData, handlePrettyFormat]);

	const smartAnchors = calculateSmartAnchors(relsData);

	// Pre-compute unary index & count per entity so multiple loops are offset
	const unaryCountByEntity = useMemo(() => {
		const countMap = new Map<string, number>();
		const indexMap = new Map<number, { index: number; count: number }>();
		// First pass: count unary rels per entity
		relsData.forEach((rel) => {
			const from = rel.arrows[0].from;
			const to = rel.arrows[0].to;
			if (from === to) {
				countMap.set(from, (countMap.get(from) || 0) + 1);
			}
		});
		// Second pass: assign index per unary rel
		const seenMap = new Map<string, number>();
		relsData.forEach((rel, i) => {
			const from = rel.arrows[0].from;
			const to = rel.arrows[0].to;
			if (from === to) {
				const seen = seenMap.get(from) || 0;
				indexMap.set(i, { index: seen, count: countMap.get(from)! });
				seenMap.set(from, seen + 1);
			}
		});
		return indexMap;
	}, [relsData]);

	// Drag-and-drop .txt file loading
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const file = e.dataTransfer.files?.[0];
		if (!file || !file.name.endsWith('.txt')) return;
		const reader = new FileReader();
		reader.onload = () => {
			handleLoadDiagramFile(reader.result as string);
		};
		reader.readAsText(file);
	}, [handleLoadDiagramFile]);

	return (
		<>
			<Xwrapper>
				<div
					ref={canvasRef}
					className={styles.mainCanvas}
					style={{ backgroundColor: currentPalette.background }}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
				>
					<PaletteDropdown
						selectedPaletteId={selectedPaletteId}
						onSelectPalette={handleSelectPalette}
					/>
					<SettingsDropdown
						canvasRef={canvasRef}
						entitiesData={entitiesData}
						relsData={relsData}
						onLoadDiagramFile={handleLoadDiagramFile}
					/>
					{
						entitiesData.map((entityData: EntityDataType, i: number) => {
							const entityId = `${entityData.type != "connector" ? "entity" : "connector"}:${entityData.name.toLowerCase()}`;
							return (
								<Entity key={entityId}
									data={entityData}
									index={i}
									onUpdateEntity={updateEntityAtIndex}
									onDeleteEntity={deleteEntityAtIndex}
									entityStyle={{
										stroke: currentPalette.entityStroke,
										text: currentPalette.entityText,
										fill: currentPalette.entityFill,
										isFrosted: currentPalette.isFrosted,
									}}
									entityId={entityId}
									isActive={activeEntityId === entityId}
									onActivate={setActiveEntityId}
									pos={cameraPos}
									deltaPos={deltaPos}
									layoutPos={entityLayoutPositions?.[i] ?? null}
									onPrettyFormat={handlePrettyFormat} />
							)
						})
					}
					{
						relsData.map((relData: RelDataType, i: number) => {
							const { from: from1, to: to1, cardinality: cardinality1 } = relData.arrows[0];
							const { from: from2, to: to2, cardinality: cardinality2 } = relData.arrows[1];

							// 2. Retrieve the calculated anchors for this specific relationship index
							const anchors = smartAnchors.get(i) || {};

							// Fallback to "auto" if calculation failed (e.g. on first render before DOM exists)
							let startAnchor = anchors.start || "auto";
							let endAnchor = anchors.end || "auto";
							let isUnary = from1 == to1;

							const strokeWidth = 2;

							const arrowIconSize = relData.type == "double" ? 4 : 6;
							const relLabel = (
								<RelationshipLabel
									relData={relData}
									relIndex={i}
									onUpdateRelationship={updateRelationshipAtIndex}
									onDeleteRelationship={deleteRelationshipAtIndex}
									backgroundColor={currentPalette.background}
									textColor={currentPalette.entityText}
									strokeColor={currentPalette.entityStroke}
								/>
							);

							const arrowStyle = {
								lineColor: currentPalette.entityStroke,
								strokeWidth: 3,
								headSize: arrowIconSize,
								headShape: {
									svgElem: <CardinalityIcon type={cardinality1}
										fill={currentPalette.entityStroke}
										stroke={currentPalette.entityStroke}
										strokeWidth={strokeWidth} />,
									offsetForward: 1,
								},

								showTail: true,
								tailSize: arrowIconSize,
								tailShape: {
									svgElem: <CardinalityIcon type={cardinality2}
										fill={currentPalette.entityStroke}
										stroke={currentPalette.entityStroke}
										strokeWidth={strokeWidth} />,
									offsetForward: 1,
								},

								curveness: 0.8,
								labels: {
									middle: relLabel,
								},
							}

							const headlessArrowStyle = {
								lineColor: currentPalette.entityStroke,
								showHead: false,
								showTail: false,
								curveness: 0,
								labels: {
									middle: relLabel,
								},
							}

							// Unary (self-referencing) relationships use a looping SVG arrow
							if (isUnary) {
								const unaryInfo = unaryCountByEntity.get(i);
								return <UnaryArrow
									key={i.toString()}
									entityId={from1}
									strokeColor={currentPalette.entityStroke}
									startCardinality={cardinality1}
									endCardinality={cardinality2}
									unaryIndex={unaryInfo?.index ?? 0}
									unaryCount={unaryInfo?.count ?? 1}>
									{relLabel}
								</UnaryArrow>
							}

							if (relData.type == "double") {
								return <DoubleArrow
									key={i.toString()}
									start={from1}
									end={to1}

									// dynamic anchors
									startAnchor={startAnchor}
									endAnchor={endAnchor}

									{...arrowStyle}

									strokeWidth={3}
									gap={5}
									color={currentPalette.entityStroke}
									bgColor={currentPalette.background}
								/>
							}
							else if (relData.type == "doubleHeadless") {
								return <DoubleArrow
									key={i.toString()}
									start={from1}
									end={to1}

									// dynamic anchors
									startAnchor={startAnchor}
									endAnchor={endAnchor}

									{...headlessArrowStyle}

									strokeWidth={3}
									gap={5}
									color={currentPalette.entityStroke}
									bgColor={currentPalette.background}
								/>
							}
							else if (relData.type == "singleHeadless") {
								return <Xarrow
									key={i.toString()}
									start={from1}
									end={to1}

									// dynamic anchors
									startAnchor={startAnchor}
									endAnchor={endAnchor}

									{...headlessArrowStyle} />
							}

							// rel type = "single"
							return <Xarrow
								key={i.toString()}
								start={from1}
								end={to1}

								// dynamic anchors
								startAnchor={startAnchor}
								endAnchor={endAnchor}

								{...arrowStyle} />
						})
					}
				</div>
			</Xwrapper>
			<CommandPrompt addObjectToCanvas={addObjectToCanvas} loadDiagramToCanvas={loadDiagramToCanvas} />
			<CommandErrorToast />
			<button
				onClick={() => setShowHelp(true)}
				title="Help"
				style={{
					position: 'fixed',
					top: 12,
					right: 12,
					width: 32,
					height: 32,
					borderRadius: '50%',
					border: 'none',
					backgroundColor: 'rgba(0, 0, 0, 0.6)',
					color: 'white',
					fontSize: 18,
					fontWeight: 600,
					cursor: 'pointer',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 1001,
				}}
				onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)')}
				onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)')}
			>
				?
			</button>
			{showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
		</>
	);
}
