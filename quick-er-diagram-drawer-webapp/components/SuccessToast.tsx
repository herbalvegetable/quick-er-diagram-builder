import toast from 'react-hot-toast';

/**
 * Shows a success toast notification (green background).
 * Auto-dismisses after 4 seconds.
 */
export function showSuccessToast(message: string): string {
	return toast.custom(
		(t) => (
			<div
				style={{
					background: '#16A34A',
					color: '#FFFFFF',
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
		{ duration: 4000 },
	);
}
