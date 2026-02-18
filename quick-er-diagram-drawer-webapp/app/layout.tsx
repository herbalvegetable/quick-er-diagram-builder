import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

import AppProvider from "@/context/AppProvider";

export const metadata: Metadata = {
	title: "QuickER",
	description: "i built this because draw.io sucks",
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
					<Analytics />
				</body>
			</AppProvider>
		</html>
	);
}
