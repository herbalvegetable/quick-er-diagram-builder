import toast from 'react-hot-toast';

/**
 * Shows a loading toast notification (black background, white border).
 * Returns the toast id so it can be dismissed later with toast.dismiss(id).
 */
export function showLoadingToast(message: string): string {
	return toast.custom(
		(t) => (
			<div
				style={{
					background: '#000000',
					color: '#FFFFFF',
					border: '1px solid #FFFFFF',
					borderRadius: '8mm',
					padding: '0.75em 1em',
					fontSize: '14px',
					width: '75vw',
					maxWidth: '75vw',
					display: 'flex',
					alignItems: 'center',
					transform: t.visible ? 'translateY(0)' : 'translateY(50px)',
					opacity: t.visible ? 1 : 0,
					transition: 'transform 0.35s ease-in-out, opacity 0.35s ease-in-out',
				}}
			>
				<span style={{ flex: 1 }}>{message}</span>
				<button
					onClick={() => toast.dismiss(t.id)}
					style={{
						background: 'transparent',
						border: 'none',
						color: '#FFFFFF',
						fontSize: '16px',
						cursor: 'pointer',
						marginLeft: '8px',
						padding: '0 4px',
						lineHeight: 1,
						opacity: 0.8,
					}}
					onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
					onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
					aria-label="Dismiss"
				>
					&#x2715;
				</button>
			</div>
		),
		{ duration: Infinity },
	);
}
