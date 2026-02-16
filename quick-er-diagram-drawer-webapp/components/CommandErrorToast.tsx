import toast, { Toaster } from 'react-hot-toast';

/**
 * Shows an error toast notification (red background).
 * Auto-dismisses after 4 seconds.
 */
export function showErrorToast(message: string): string {
	return toast.custom(
		(t) => (
			<div
				style={{
					background: '#DC2626',
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

/**
 * Place this component once in the app to provide toast positioning.
 * Individual toast types (error, loading, success) handle their own styling.
 */
export default function CommandErrorToast() {
	return (
		<Toaster
			position="bottom-center"
			containerStyle={{
				bottom: 100,
			}}
		/>
	);
}
