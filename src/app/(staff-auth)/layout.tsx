export default function StaffAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-purple-600 selection:text-white flex flex-col">
      {children}
    </div>
  );
}
