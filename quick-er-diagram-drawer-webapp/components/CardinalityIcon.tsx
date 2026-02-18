export default function CardinalityIcon(props: any) {
    const { type, fill, stroke, strokeWidth } = props;
    switch (type) {
        case "11":
            return (
                <g transform="scale(0.1) translate(5, 5)">
                    <path
                        stroke={stroke}
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill={fill}
                        d="M-2 -4 V4 M2 -4 V4"
                    />
                </g>
            )
            break;
        case "01":
            return (
                <g transform="scale(0.1) translate(0, 5)">
                    <circle
                        cx="-3"
                        cy="0"
                        r="3"
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    <path
                        d="M4 -5 V5"
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        fill={fill}
                    />
                </g>
            )
            break;
        case "0m":
            return (
                <g transform="scale(0.1) translate(-1, 5)">
                    <circle
                        cx="-3"
                        cy="0"
                        r="3"
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    <path
                        d="M3 0 L7 -5 M3 0 L7 5"
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        fill="none"
                    />
                </g>
            )
            break;
        case "1m":
            return (
                <g transform="scale(0.08) translate(0, 6)">
                    <path
                        d="M-3 -5 V5"
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        fill={fill}
                    />
                    <path
                        d="M3 0 L7 -5 M3 0 L7 5"
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        fill={fill}
                    />
                </g>
            )
            break;
    }
}