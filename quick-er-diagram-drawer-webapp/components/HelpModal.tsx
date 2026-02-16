import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import styles from './HelpModal.module.css';

type Props = {
	onClose: () => void;
};

export default function HelpModal({ onClose }: Props) {
	const overlayRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [onClose]);

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === overlayRef.current) onClose();
	};

	return createPortal(
		<div ref={overlayRef} className={styles.overlay} onClick={handleOverlayClick}>
			<div className={styles.modal}>
				<button className={styles.closeBtn} onClick={onClose}>&#x2715;</button>

				<h2 className={styles.title}>Quick ER Diagram Drawer</h2>
				<p className={styles.description}>
					A fast, command-line inspired tool for creating Entity-Relationship diagrams.
					Type commands in the prompt at the bottom to build your diagram, or use the AI generator.
				</p>

				<hr className={styles.divider} />

				<h3 className={styles.sectionTitle}>Entity Commands</h3>
				<p className={styles.syntax}>
					<code>!en &lt;name&gt;[.&lt;type&gt;[.&lt;options&gt;]] [attributes]</code>
				</p>

				<table className={styles.table}>
					<thead>
						<tr><th>Example</th><th>Description</th></tr>
					</thead>
					<tbody>
						<tr>
							<td><code>!en user u.id, name, email</code></td>
							<td>Strong entity with primary key <em>id</em></td>
						</tr>
						<tr>
							<td><code>!en payment.weak du.paymentNo, amount</code></td>
							<td>Weak entity with partial key <em>paymentNo</em></td>
						</tr>
						<tr>
							<td><code>!en enrolment.assoc grade</code></td>
							<td>Associative entity</td>
						</tr>
						<tr>
							<td><code>!en vehicle.super.total.disjoint u.vin, type(d)</code></td>
							<td>Super entity (total, disjoint) with subtype discriminator</td>
						</tr>
						<tr>
							<td><code>!en person.super.partial.overlap u.NRIC, type(o)</code></td>
							<td>Super entity (partial, overlap) with subtype discriminator</td>
						</tr>
						<tr>
							<td><code>!en car.sub.vehicle numDoors</code></td>
							<td>Sub entity of <em>vehicle</em></td>
						</tr>
					</tbody>
				</table>

				<h4 className={styles.subTitle}>Attribute Prefixes</h4>
				<table className={styles.table}>
					<thead>
						<tr><th>Prefix</th><th>Meaning</th></tr>
					</thead>
					<tbody>
						<tr><td><code>u.</code></td><td>Primary key (underlined)</td></tr>
						<tr><td><code>du.</code></td><td>Partial key (dashed underline)</td></tr>
						<tr><td>(none)</td><td>Regular attribute</td></tr>
					</tbody>
				</table>

				<hr className={styles.divider} />

				<h3 className={styles.sectionTitle}>Relationship Commands</h3>
				<p className={styles.syntax}>
					<code>!rel &lt;from&gt; &lt;card&gt; &lt;name&gt; &lt;card&gt; &lt;to&gt; [type] {'{'} attrs {'}'}</code>
				</p>

				<h4 className={styles.subTitle}>Cardinality Codes</h4>
				<table className={styles.table}>
					<thead>
						<tr><th>Code</th><th>Meaning</th></tr>
					</thead>
					<tbody>
						<tr><td><code>11</code></td><td>Exactly one</td></tr>
						<tr><td><code>01</code></td><td>Zero or one</td></tr>
						<tr><td><code>0m</code></td><td>Zero or many</td></tr>
						<tr><td><code>1m</code></td><td>One or many</td></tr>
					</tbody>
				</table>

				<table className={styles.table}>
					<thead>
						<tr><th>Example</th><th>Description</th></tr>
					</thead>
					<tbody>
						<tr>
							<td><code>!rel student 0m enrols_in 0m course</code></td>
							<td>Many-to-many</td>
						</tr>
						<tr>
							<td><code>!rel department 1m has 11 employee</code></td>
							<td>One-to-many</td>
						</tr>
						<tr>
							<td><code>!rel employee 11 manages 01 department double</code></td>
							<td>Double-line (total participation)</td>
						</tr>
						<tr>
							<td><code>!rel student 0m takes 0m course {'{'}grade, semester{'}'}</code></td>
							<td>With attributes</td>
						</tr>
						<tr>
							<td><code>!rel employee 0m supervises 01 employee</code></td>
							<td>Unary (self-referencing)</td>
						</tr>
					</tbody>
				</table>

				<hr className={styles.divider} />

				<h3 className={styles.sectionTitle}>AI Diagram Generation</h3>
				<p className={styles.syntax}>
					<code>!ai &lt;business rules in plain English&gt;</code>
				</p>
				<p className={styles.description}>
					Describe your requirements in natural language and the AI will generate the entities and relationships for you.
				</p>

				<hr className={styles.divider} />

				<h3 className={styles.sectionTitle}>Mouse &amp; Keyboard Actions</h3>
				<table className={styles.table}>
					<thead>
						<tr><th>Action</th><th>Effect</th></tr>
					</thead>
					<tbody>
						<tr><td>Left-click drag an entity</td><td>Move the entity</td></tr>
						<tr><td>Middle-click drag canvas</td><td>Pan the camera</td></tr>
						<tr><td>Right-click an entity</td><td>Open context menu (Edit, Delete, Pretty Format)</td></tr>
						<tr><td>Right-click a relationship label</td><td>Open context menu (Delete Relationship)</td></tr>
						<tr><td>Double-click an entity</td><td>Enter edit mode (rename, edit attributes)</td></tr>
						<tr><td>Double-click a relationship label</td><td>Enter edit mode (rename, edit attributes)</td></tr>
						<tr><td>Tab (while editing)</td><td>Add a new attribute below the current one</td></tr>
						<tr><td>Backspace on empty attribute</td><td>Delete the empty attribute</td></tr>
						<tr><td>Enter (while editing)</td><td>Save changes and exit edit mode</td></tr>
						<tr><td>Click outside (while editing)</td><td>Auto-save and exit edit mode</td></tr>
						<tr><td>Drag a .txt file onto the canvas</td><td>Load diagram code from the file</td></tr>
					</tbody>
				</table>
			</div>
		</div>,
		document.body
	);
}
