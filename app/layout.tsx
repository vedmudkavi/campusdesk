import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'CampusDesk · Better campus, together',description:'Report, track and resolve campus issues in one place.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
