import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

import styles from './CommandPrompt.module.css';

import { interpretCommand, promptGenerateDiagramModel } from '@/util/extractCode';
import { showErrorToast } from '@/components/CommandErrorToast';
import { showLoadingToast } from '@/components/LoadingToast';
import { showSuccessToast } from '@/components/SuccessToast';

const MAX_ROWS = 10;

export default function CommandPrompt(props: any) {

    const { addObjectToCanvas, loadDiagramToCanvas } = props;

    const [text, setText] = useState<string>("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleInputChange = (e: any) => {
        setText(e.target.value);
    }

    // auto-resize the textarea to fit content, up to MAX_ROWS
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;

        // reset height so scrollHeight recalculates
        el.style.height = 'auto';

        // compute the line height from computed styles
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
        const maxHeight = lineHeight * MAX_ROWS;

        el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    }, [text]);

    const handleKeydown = (e: any) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onEnterCommand(text.trim());
            setText('');
        }
    }

    const onEnterCommand = (commandStr: string) => {
        // Handle !ai prefix separately (async)
        const aiMatch = commandStr.match(/^!ai\s+([\s\S]+)/i);
        if (aiMatch) {
            const rulesText = aiMatch[1].trim();
            if (!rulesText) {
                showErrorToast('Please provide business rules after "!ai".');
                return;
            }
            const loadingId = showLoadingToast('Generating diagram with AI...');
            promptGenerateDiagramModel(rulesText)
                .then((data) => {
                    toast.dismiss(loadingId);
                    loadDiagramToCanvas(data);
                    showSuccessToast('Diagram generated successfully!');
                })
                .catch((err: any) => {
                    toast.dismiss(loadingId);
                    const message = err?.message ?? 'Failed to generate diagram from AI.';
                    showErrorToast(message);
                });
            return;
        }

        try {
            const result = interpretCommand(commandStr);

            if (!result.obj) {
                // Nothing to add, but this shouldn't normally happen now that we throw on bad commands
                return;
            }

            addObjectToCanvas(result);
        }
        catch (err: any) {
            const message = err?.message ?? 'Unknown error while parsing command.';
            showErrorToast(message);
        }
    }

    return (
        <div className={styles.promptContainer}>
            <textarea
                ref={textareaRef}
                className={styles.input}
                value={text}
                onChange={handleInputChange}
                onKeyDown={handleKeydown}
                rows={1}
                placeholder={'!en to create an Entity, !rel to create a Relationship, !ai to generate a diagram with AI'} />
        </div>
    )
}
