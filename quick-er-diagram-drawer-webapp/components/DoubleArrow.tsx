import React from 'react';
import Xarrow from 'react-xarrows';

export default function DoubleArrow(props: any) {
    const { strokeWidth, gap, color, bgColor, ...arrowProps } = props;
    // 1. The "Outer" Arrow (The border)
    // Total width = 2 * individual line width + gap
    const outerWidth = (strokeWidth * 2) + gap;

    // 2. The "Inner" Arrow (The mask)
    // This creates the empty space in the middle
    const innerWidth = gap;

    return (
        <>
            {/* Bottom Layer: The main color */}
            <Xarrow
                {...arrowProps}
                lineColor={color}
                strokeWidth={outerWidth}
                zIndex={0}
                showHead={false}
                showTail={false}
            />

            {/* Top Layer: The 'gap' color (masks the center) */}
            <Xarrow
                {...arrowProps}
                lineColor={bgColor}
                strokeWidth={innerWidth}
                zIndex={1}
                // Remove arrowheads from the mask so they don't look cut out
            />
        </>
    );
};