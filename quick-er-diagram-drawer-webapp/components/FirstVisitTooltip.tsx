import styles from './FirstVisitTooltip.module.css';

type Props = {
	visible: boolean;
};

export default function FirstVisitTooltip({ visible }: Props) {
	if (!visible) return null;

	return (
		<div className={styles.tooltip}>
			<div className={styles.bubble}>
				Click here to learn how to create entities &amp; relationships!
			</div>
			<div className={styles.arrow} />
		</div>
	);
}
