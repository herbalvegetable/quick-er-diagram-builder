import dagre from 'dagre';
import { EntityDataType, RelDataType } from '@/types';

/**
 * Uses dagre to compute a pretty layout for all entities based on their
 * relationships. Returns a list of [worldX, worldY] positions in the
 * EXACT order of the entitiesData array.
 */
export function getDiagramPrettyLayout(
	entitiesData: EntityDataType[],
	relsData: RelDataType[],
	cameraPos: number[],
): number[][] {
	const g = new dagre.graphlib.Graph();
	g.setGraph({ rankdir: 'TB', nodesep: 120, ranksep: 200, marginx: 40, marginy: 40 });
	g.setDefaultEdgeLabel(() => ({}));

	// Build a map from entityId -> index for output ordering
	const idToIndex = new Map<string, number>();

	entitiesData.forEach((entity, i) => {
		const entityId = `${entity.type !== 'connector' ? 'entity' : 'connector'}:${entity.name.toLowerCase()}`;
		idToIndex.set(entityId, i);

		// Estimate node dimensions
		const width = entity.type === 'connector' ? 50 : 160;
		const height = entity.type === 'connector' ? 50 : 40 + (entity.attrs?.length ?? 0) * 24;

		g.setNode(entityId, { width, height });
	});

	// Add edges from relationships
	relsData.forEach((rel) => {
		const from = rel.arrows[0].from;
		const to = rel.arrows[0].to;
		if (g.hasNode(from) && g.hasNode(to)) {
			g.setEdge(from, to);
		}
	});

	dagre.layout(g);

	// Compute the center of the dagre layout
	const nodeIds = g.nodes();
	let sumX = 0, sumY = 0;
	nodeIds.forEach((id) => {
		const node = g.node(id);
		sumX += node.x;
		sumY += node.y;
	});
	const centerX = sumX / nodeIds.length;
	const centerY = sumY / nodeIds.length;

	// Convert dagre positions to world coordinates
	// Screen position formula: screenX = middleX + cameraPos[0] - worldPos[0]
	// We want: screenX = middleX + (dagreX - centerX)
	// Therefore: worldPos[0] = cameraPos[0] - (dagreX - centerX)
	const positions: number[][] = new Array(entitiesData.length);

	nodeIds.forEach((id) => {
		const node = g.node(id);
		const idx = idToIndex.get(id);
		if (idx !== undefined) {
			positions[idx] = [
				cameraPos[0] - (node.x - centerX),
				cameraPos[1] - (node.y - centerY),
			];
		}
	});

	return positions;
}
