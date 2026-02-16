import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import styles from './ContextMenu.module.css';

type RelationshipContextMenuProps = {
    x: number;
    y: number;
    onDelete: () => void;
    onClose: () => void;
};

export default function RelationshipContextMenu({ x, y, onDelete, onClose }: RelationshipContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    // close on any click outside the menu
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        window.addEventListener('mousedown', handleClickOutside, true);
        return () => {
            window.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [onClose]);

    // close on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return createPortal(
        <div
            ref={menuRef}
            className={styles.contextMenu}
            style={{ left: x, top: y }}
        >
            <button
                className={`${styles.menuItem} ${styles.menuItemDelete}`}
                onClick={() => {
                    onDelete();
                    onClose();
                }}
            >
                <span className={styles.icon}>&#x1F5D1;</span>
                Delete Relationship
            </button>
        </div>,
        document.body
    );
}
