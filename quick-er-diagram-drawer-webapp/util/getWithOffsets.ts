import { RelDataType } from "@/types";

export function calculateSmartAnchors(relationships: RelDataType[], gap: number = 25) {
    const anchors = new Map(); // Stores the final props for each relationship index
    const sides = new Map();   // Group arrows by "EntityId + Side"

    relationships.forEach((rel, index) => {
        // 1. Get DOM Elements to find positions
        // from/to already contain the correct prefix (entity: or connector:)
        const startId = rel.arrows[0].from.toLowerCase();
        const endId = rel.arrows[0].to.toLowerCase();
        const startEl = document.getElementById(startId);
        const endEl = document.getElementById(endId);

        if (!startEl || !endEl) return;

        // 2. Calculate center points
        const startRect = startEl.getBoundingClientRect();
        const endRect = endEl.getBoundingClientRect();

        const startCenter = { x: startRect.left + startRect.width / 2, y: startRect.top + startRect.height / 2 };
        const endCenter = { x: endRect.left + endRect.width / 2, y: endRect.top + endRect.height / 2 };

        // 3. Determine the "Slope" to decide Top/Bottom vs Left/Right
        const dx = endCenter.x - startCenter.x;
        const dy = endCenter.y - startCenter.y;

        let startSide = "auto";
        let endSide = "auto";

        // If horizontal distance is greater than vertical, use Left/Right
        if (Math.abs(dx) > Math.abs(dy)) {
            startSide = dx > 0 ? "right" : "left"; // Start is to the left of End
            endSide = dx > 0 ? "left" : "right";   // End is to the right of Start
        } else {
            // Use Top/Bottom
            startSide = dy > 0 ? "bottom" : "top";
            endSide = dy > 0 ? "top" : "bottom";
        }

        // 4. Register these sides for grouping
        // Key format: "EntityID:Side" -> e.g., "entity:course:left"
        const startKey = `${startId}:${startSide}`;
        const endKey = `${endId}:${endSide}`;

        if (!sides.has(startKey)) sides.set(startKey, []);
        if (!sides.has(endKey)) sides.set(endKey, []);

        sides.get(startKey).push({ index, type: 'start', side: startSide });
        sides.get(endKey).push({ index, type: 'end', side: endSide });
    });

    // 5. Calculate offsets within each group
    sides.forEach((items) => {
        // 'items' contains all arrows hitting this specific side of this specific entity
        const total = items.length;

        items.forEach((item: any, i: number) => {
            // The Formula: Center the group
            const offsetValue = (i - (total - 1) / 2) * gap;

            const side = item.side;
            const isVertical = side === 'top' || side === 'bottom';

            // Create the anchor object Xarrow expects
            const anchorObj = {
                position: side,
                offset: isVertical
                    ? { x: offsetValue } // Top/Bottom needs X offset
                    : { y: offsetValue } // Left/Right needs Y offset
            };

            // Store result
            if (!anchors.has(item.index)) anchors.set(item.index, {});
            if (item.type === 'start') {
                anchors.get(item.index).start = anchorObj;
            } else {
                anchors.get(item.index).end = anchorObj;
            }
        });
    });

    return anchors;
};