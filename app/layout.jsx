'use client'
import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import AdminLayout from "@/components/admin/AdminLayout";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <title>GoCart Admin Console</title>
                <link rel="icon" href="/icon.png" type="image/png" sizes="any" />
                <link rel="apple-touch-icon" href="/icon.png" />
            </head>
            <body className={`${outfit.className} antialiased`}>
                <StoreProvider>
                    <Toaster />
                    <AdminLayout>
                        {children}
                    </AdminLayout>
                </StoreProvider>
            </body>
        </html>
    );
}
