import { useState, useEffect, useRef } from 'react';
import { useXarrow } from 'react-xarrows';

import styles from './Entity.module.css';

import { useCameraPositionContext } from '@/context/CameraPositionProvider';

import { Position } from '@/lib/Position';

import ContextMenu from './ContextMenu';

export default function Entity(props: any) {
    const { data, entityStyle, entityId, pos, deltaPos, index, onUpdateEntity, onDeleteEntity, isActive, onActivate, layoutPos, onPrettyFormat } = props;

    const { cameraPos } = useCameraPositionContext();

    const position = new Position(pos, cameraPos);
    const updateXarrow = useXarrow();

    // track initial drag position
    const dragStartPosRef = useRef([0, 0]);

    // track "stale" delta (race condition fixer)
    const dragStartDeltaRef = useRef([0, 0]);

    const [isGrabbed, setIsGrabbed] = useState(false);

    // edit mode state (for normal entities)
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(data.name);
    const [editAttrs, setEditAttrs] = useState<any[]>(data.attrs || []);
    const attrInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // track layout updates so xarrow redraws after position change
    const [layoutTick, setLayoutTick] = useState(0);

    // when layoutPos changes (from Pretty Format), move entity to the new position
    useEffect(() => {
        if (layoutPos) {
            position.setPos(layoutPos);
            position.setScreenPos(cameraPos);
            setLayoutTick((c) => c + 1);
        }
    }, [layoutPos]);

    // keep local edit buffer in sync when data changes and we're not actively editing
    useEffect(() => {
        if (!isEditing) {
            setEditName(data.name);
            setEditAttrs(data.attrs || []);
        }
    }, [data, isEditing]);

    useEffect(() => {
        position.setScreenPos(cameraPos);
        // console.log("Screen pos: ", position.ref.current.screenPos);

        // update xarrow; redraw lines connecting to this entity
        updateXarrow();
    }, [isGrabbed, cameraPos, deltaPos, layoutTick]);

    const handleMouseDown = (e: any) => {
        // e.preventDefault();
        // e.stopPropagation();
        dragStartDeltaRef.current = deltaPos;
        dragStartPosRef.current = [...position.ref.current.pos];
        setIsGrabbed(true);
    }

    const handleMouseUp = (e: any) => {
        // e.preventDefault();
        setIsGrabbed(false);
    }

    useEffect(() => {
        console.log('Entity grabbed: ', isGrabbed);
    }, [isGrabbed]);

    // reset the "stale" delta when parent successfully resets deltaPos
    useEffect(() => {
        if (deltaPos[0] == 0 && deltaPos[1] == 0) {
            dragStartDeltaRef.current = [0, 0];
        }
    }, [deltaPos]);

    // move with mouse IF grabbed
    useEffect(() => {
        if (isGrabbed) {
            const effectiveDeltaX = deltaPos[0] - dragStartDeltaRef.current[0];
            const effectiveDeltaY = deltaPos[1] - dragStartDeltaRef.current[1];

            position.setPos([
                dragStartPosRef.current[0] + effectiveDeltaX,
                dragStartPosRef.current[1] + effectiveDeltaY,
            ]);
            // console.log('Delta pos when grabbed: ', deltaPos);
            position.setScreenPos(cameraPos);
        }
    }, [isGrabbed, cameraPos, deltaPos]);

    const handleEnterSave = () => {
        if (onUpdateEntity && typeof index === 'number') {
            const updatedEntity = {
                ...data,
                name: editName,
                attrs: editAttrs,
            };
            onUpdateEntity(index, updatedEntity);
        }
        setIsEditing(false);
    };

    const handleAttributeKeyDown = (e: any, i: number) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            setEditAttrs((prev) => {
                const newAttrs = [...prev];
                const baseAttr = prev[i] || { name: '', type: 'normal' };
                newAttrs.splice(i + 1, 0, { ...baseAttr, name: '' });
                return newAttrs;
            });

            // focus the newly added attribute input on the next tick
            setTimeout(() => {
                const next = attrInputRefs.current[i + 1];
                if (next) {
                    next.focus();
                }
            }, 0);
        }
        else if (e.key === 'Backspace' && editAttrs[i]?.name === '') {
            e.preventDefault();
            setEditAttrs((prev) => {
                const newAttrs = [...prev];
                newAttrs.splice(i, 1);
                return newAttrs;
            });

            // focus the previous attribute, or the name input if there's none
            setTimeout(() => {
                if (i > 0) {
                    const prev = attrInputRefs.current[i - 1];
                    if (prev) prev.focus();
                }
            }, 0);
        }
        else if (e.key === 'Enter') {
            e.preventDefault();
            handleEnterSave();
        }
    };

    const handleNameKeyDown = (e: any) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleEnterSave();
        }
    };

    const handleWrapperMouseDown = (e: any) => {
        if (onActivate) {
            onActivate(entityId);
        }
        if (!isEditing) {
            handleMouseDown(e);
        }
    };

    // context menu state
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const handleContextEdit = () => {
        setIsEditing(true);
    };

    const handleContextDelete = () => {
        if (onDeleteEntity) {
            onDeleteEntity(index);
        }
    };

    return (
        <div style={{ // positioning wrapper, put Entity components within this wrapper
            position: 'absolute',
            left: `${position.ref.current.screenPos[0]}px`,
            top: `${position.ref.current.screenPos[1]}px`,
            zIndex: isActive ? 100 : 1,
        }}
            onMouseDown={handleWrapperMouseDown}
            onMouseUp={isEditing ? undefined : handleMouseUp}
            onContextMenu={handleContextMenu}>
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onEdit={handleContextEdit}
                    onDelete={handleContextDelete}
                    onPrettyFormat={onPrettyFormat}
                    onClose={() => setContextMenu(null)}
                />
            )}
            {
                data.type == "connector" ? // connector entity

                    <div className={`${styles.connector}`}
                        id={entityId}
                        style={{
                            border: `1px solid ${entityStyle.stroke}`,
                            color: entityStyle.text,
                            backgroundColor: entityStyle.fill,
                            backdropFilter: entityStyle.isFrosted ? 'blur(8px)' : undefined,
                        }}>
                        <span className={styles.discText}>{data.options[1]! == "disjoint" ? "d" : "o"}</span>
                    </div>

                    : // normal entity

                    <div className={`${styles.entity}`}
                        id={entityId}
                        style={{
                            border: `${data.type == "weak" ? "8" : "2"}px ${data.type == "weak" ? "double" : "solid"} ${entityStyle.stroke}`,
                            borderRadius: `${data.type == "assoc" ? '12px' : '0px'}`,
                            backgroundColor: entityStyle.fill,
                            color: entityStyle.text,
                            backdropFilter: entityStyle.isFrosted ? 'blur(8px)' : undefined,
                        }}
                        onDoubleClick={(e) => {
                            console.log("double click entity");
                            // enable editing for all non-connector entities
                            if (data.type !== "connector") {
                                e.stopPropagation();
                                setIsEditing(true);
                            }
                        }}
                        onBlur={(e) => {
                            // when focus leaves the entire entity (not just moving between its children),
                            // save edits like pressing Enter
                            const related = e.relatedTarget as Node | null;
                            if (!related || !e.currentTarget.contains(related)) {
                                handleEnterSave();
                            }
                        }}>
                        {
                            isEditing
                                ? (
                                    <>
                                        <input
                                            className={styles.name}
                                            style={{ textTransform: 'uppercase' }}
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={handleNameKeyDown}
                                            autoFocus
                                        />
                                        {
                                            editAttrs.map((attr: any, i: number) => {
                                                let attrClassType;
                                                switch (attr.type) {
                                                    case 'primary':
                                                        attrClassType = styles.primary;
                                                        break;
                                                    case 'partial':
                                                        attrClassType = styles.partial;
                                                        break;
                                                }
                                                return (
                                                    <input
                                                        key={i.toString()}
                                                        ref={(el: any) => attrInputRefs.current[i] = el}
                                                        className={`${styles.attribute} ${attrClassType}`}
                                                        value={attr.name}
                                                        onChange={(e) => {
                                                            const newAttrs = [...editAttrs];
                                                            newAttrs[i] = { ...newAttrs[i], name: e.target.value };
                                                            setEditAttrs(newAttrs);
                                                        }}
                                                        onKeyDown={(e) => handleAttributeKeyDown(e, i)}
                                                    />
                                                )
                                            })
                                        }
                                    </>
                                )
                                : (
                                    <>
                                        <span className={styles.name}>{data.name.toUpperCase()}</span>
                                        {
                                            data.attrs.map((attr: any, i: number) => {
                                                let attrClassType;
                                                switch (attr.type) {
                                                    case 'primary':
                                                        attrClassType = styles.primary;
                                                        break;
                                                    case 'partial':
                                                        attrClassType = styles.partial;
                                                        break;
                                                }
                                                return (
                                                    <span key={i.toString()}
                                                        className={`${styles.attribute} ${attrClassType}`}>
                                                        {attr.name}
                                                    </span>
                                                )
                                            })
                                        }
                                    </>
                                )
                        }
                    </div>
            }
        </div>
    )
}