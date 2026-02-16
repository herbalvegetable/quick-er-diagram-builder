import type { Metadata } from "next";
import "./globals.css";

import AppProvider from "@/context/AppProvider";

export const metadata: Metadata = {
	title: "Quick ER Diagram Editor",
	description: "for smu is112 DM mod",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<AppProvider>
				<body>
					{children}
				</body>
			</AppProvider>
		</html>
	);
}
