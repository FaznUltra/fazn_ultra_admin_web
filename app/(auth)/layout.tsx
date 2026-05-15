export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">FAZN</h1>
          <p className="text-gray-400 text-sm mt-1">Admin Portal</p>
        </div>
        {children}
      </div>
    </div>
  );
}
