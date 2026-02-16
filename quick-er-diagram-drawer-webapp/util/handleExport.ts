import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export async function handleExportPDF(canvas: HTMLDivElement) {
    // Temporarily hide UI overlays so they don't appear in the screenshot
    const overlays = canvas.querySelectorAll<HTMLElement>(
        '[class*="paletteMenu"], [class*="settingsMenu"]'
    );
    overlays.forEach((el) => (el.style.visibility = 'hidden'));

    // Save original canvas styles to restore later
    const origWidth = canvas.style.width;
    const origHeight = canvas.style.height;
    const origOverflow = canvas.style.overflow;

    try {
        // Gather all visible diagram elements
        const entityElements = canvas.querySelectorAll<HTMLElement>(
            '[id^="entity:"], [id^="connector:"]'
        );
        const arrowSvgs = canvas.querySelectorAll<SVGSVGElement>('svg.xarrow');
        const arrowLabels = canvas.querySelectorAll<HTMLElement>('[class*="xarrow"]');

        if (entityElements.length === 0) return;

        // Compute the bounding box of ALL elements relative to the canvas,
        // including ones that may be offscreen
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const canvasRect = canvas.getBoundingClientRect();

        const includeBounds = (rect: DOMRect) => {
            if (rect.width === 0 && rect.height === 0) return;
            const relLeft = rect.left - canvasRect.left + canvas.scrollLeft;
            const relTop = rect.top - canvasRect.top + canvas.scrollTop;
            minX = Math.min(minX, relLeft);
            minY = Math.min(minY, relTop);
            maxX = Math.max(maxX, relLeft + rect.width);
            maxY = Math.max(maxY, relTop + rect.height);
        };

        entityElements.forEach((el) => includeBounds(el.getBoundingClientRect()));
        arrowSvgs.forEach((el) => includeBounds(el.getBoundingClientRect()));
        arrowLabels.forEach((el) => includeBounds(el.getBoundingClientRect()));

        // Add padding
        const padding = 60;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        // The full extent the canvas needs to be to contain all elements
        const requiredWidth = Math.max(canvas.scrollWidth, maxX);
        const requiredHeight = Math.max(canvas.scrollHeight, maxY);

        // Temporarily expand the canvas to fit all content (including offscreen)
        canvas.style.width = `${requiredWidth}px`;
        canvas.style.height = `${requiredHeight}px`;
        canvas.style.overflow = 'visible';

        // Capture the full expanded canvas
        const fullDataUrl = await toPng(canvas, {
            width: requiredWidth,
            height: requiredHeight,
            backgroundColor: getComputedStyle(canvas).backgroundColor || '#000000',
            filter: (node: HTMLElement) => {
                if (node.style?.visibility === 'hidden') return false;
                return true;
            },
        });

        // Load the full image and crop to the bounding box
        const img = new Image();
        img.src = fullDataUrl;
        await new Promise<void>((resolve) => { img.onload = () => resolve(); });

        const scaleX = img.width / requiredWidth;
        const scaleY = img.height / requiredHeight;

        // Clamp crop origin to non-negative
        const cropX = Math.max(0, minX);
        const cropY = Math.max(0, minY);
        const cropWidth = maxX - cropX;
        const cropHeight = maxY - cropY;

        const offscreen = document.createElement('canvas');
        offscreen.width = cropWidth * scaleX;
        offscreen.height = cropHeight * scaleY;
        const ctx = offscreen.getContext('2d')!;
        ctx.drawImage(
            img,
            cropX * scaleX, cropY * scaleY,
            cropWidth * scaleX, cropHeight * scaleY,
            0, 0,
            offscreen.width, offscreen.height,
        );

        const croppedDataUrl = offscreen.toDataURL('image/png');

        // Create PDF sized to the cropped area
        const orientation = cropWidth > cropHeight ? 'landscape' : 'portrait';

        const pdf = new jsPDF({
            orientation,
            unit: 'px',
            format: [cropWidth, cropHeight],
        });

        pdf.addImage(croppedDataUrl, 'PNG', 0, 0, cropWidth, cropHeight);
        pdf.save('er-diagram.pdf');
    }
    finally {
        // Restore canvas to original size
        canvas.style.width = origWidth;
        canvas.style.height = origHeight;
        canvas.style.overflow = origOverflow;

        // Restore overlays
        overlays.forEach((el) => (el.style.visibility = ''));
    }
}

export async function handleExportPNG(canvas: HTMLDivElement) {
    // Temporarily hide UI overlays so they don't appear in the screenshot
    const overlays = canvas.querySelectorAll<HTMLElement>(
        '[class*="paletteMenu"], [class*="settingsMenu"]'
    );
    overlays.forEach((el) => (el.style.visibility = 'hidden'));

    // Save original canvas styles to restore later
    const origWidth = canvas.style.width;
    const origHeight = canvas.style.height;
    const origOverflow = canvas.style.overflow;

    try {
        // Gather all visible diagram elements
        const entityElements = canvas.querySelectorAll<HTMLElement>(
            '[id^="entity:"], [id^="connector:"]'
        );
        const arrowSvgs = canvas.querySelectorAll<SVGSVGElement>('svg.xarrow');
        const arrowLabels = canvas.querySelectorAll<HTMLElement>('[class*="xarrow"]');

        if (entityElements.length === 0) return;

        // Compute the bounding box of ALL elements relative to the canvas,
        // including ones that may be offscreen
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const canvasRect = canvas.getBoundingClientRect();

        const includeBounds = (rect: DOMRect) => {
            if (rect.width === 0 && rect.height === 0) return;
            const relLeft = rect.left - canvasRect.left + canvas.scrollLeft;
            const relTop = rect.top - canvasRect.top + canvas.scrollTop;
            minX = Math.min(minX, relLeft);
            minY = Math.min(minY, relTop);
            maxX = Math.max(maxX, relLeft + rect.width);
            maxY = Math.max(maxY, relTop + rect.height);
        };

        entityElements.forEach((el) => includeBounds(el.getBoundingClientRect()));
        arrowSvgs.forEach((el) => includeBounds(el.getBoundingClientRect()));
        arrowLabels.forEach((el) => includeBounds(el.getBoundingClientRect()));

        // Add padding
        const padding = 60;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        // The full extent the canvas needs to be to contain all elements
        const requiredWidth = Math.max(canvas.scrollWidth, maxX);
        const requiredHeight = Math.max(canvas.scrollHeight, maxY);

        // Temporarily expand the canvas to fit all content (including offscreen)
        canvas.style.width = `${requiredWidth}px`;
        canvas.style.height = `${requiredHeight}px`;
        canvas.style.overflow = 'visible';

        // Capture the full expanded canvas
        const fullDataUrl = await toPng(canvas, {
            width: requiredWidth,
            height: requiredHeight,
            backgroundColor: getComputedStyle(canvas).backgroundColor || '#000000',
            filter: (node: HTMLElement) => {
                if (node.style?.visibility === 'hidden') return false;
                return true;
            },
        });

        // Load the full image and crop to the bounding box
        const img = new Image();
        img.src = fullDataUrl;
        await new Promise<void>((resolve) => { img.onload = () => resolve(); });

        const scaleX = img.width / requiredWidth;
        const scaleY = img.height / requiredHeight;

        // Clamp crop origin to non-negative
        const cropX = Math.max(0, minX);
        const cropY = Math.max(0, minY);
        const cropWidth = maxX - cropX;
        const cropHeight = maxY - cropY;

        const offscreen = document.createElement('canvas');
        offscreen.width = cropWidth * scaleX;
        offscreen.height = cropHeight * scaleY;
        const ctx = offscreen.getContext('2d')!;
        ctx.drawImage(
            img,
            cropX * scaleX, cropY * scaleY,
            cropWidth * scaleX, cropHeight * scaleY,
            0, 0,
            offscreen.width, offscreen.height,
        );

        // Convert to PNG blob and trigger download
        offscreen.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'er-diagram.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }
    finally {
        // Restore canvas to original size
        canvas.style.width = origWidth;
        canvas.style.height = origHeight;
        canvas.style.overflow = origOverflow;

        // Restore overlays
        overlays.forEach((el) => (el.style.visibility = ''));
    }
}
