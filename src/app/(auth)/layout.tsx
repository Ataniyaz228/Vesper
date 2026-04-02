export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen w-full bg-[#080809] text-white font-sans antialiased selection:bg-white/20 selection:text-white">
            {children}
        </div>
    );
}
