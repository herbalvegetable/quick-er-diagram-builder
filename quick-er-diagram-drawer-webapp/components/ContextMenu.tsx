import { useEffect, useRef } from 'react';
import { FaRegFaceGrinHearts } from 'react-icons/fa6';

import styles from './ContextMenu.module.css';

type ContextMenuProps = {
    x: number;
    y: number;
    onEdit: () => void;
    onDelete: () => void;
    onPrettyFormat?: () => void;
    onClose: () => void;
};

export default function ContextMenu({ x, y, onEdit, onDelete, onPrettyFormat, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    // close on any click outside the menu
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        // use capture so this fires before other mousedowns
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

    return (
        <div
            ref={menuRef}
            className={styles.contextMenu}
            style={{ left: x, top: y }}
        >
            <button
                className={styles.menuItem}
                onClick={() => {
                    onEdit();
                    onClose();
                }}
            >
                <span className={styles.icon}>&#x270F;</span>
                Edit
            </button>
            <button
                className={`${styles.menuItem} ${styles.menuItemDelete}`}
                onClick={() => {
                    onDelete();
                    onClose();
                }}
            >
                <span className={styles.icon}>&#x1F5D1;</span>
                Delete
            </button>
            {onPrettyFormat && (
                <button
                    className={styles.menuItem}
                    onClick={() => {
                        onPrettyFormat();
                        onClose();
                    }}
                >
                    <span className={styles.icon}><FaRegFaceGrinHearts /></span>
                    Pretty Format
                </button>
            )}
        </div>
    );
}
