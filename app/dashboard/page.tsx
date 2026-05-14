import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">FAZN Admin Dashboard</h1>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
        <div className="bg-gray-900 rounded-xl p-6">
          <p className="text-gray-400 text-sm">Logged in as: <span className="text-white font-mono">{userId}</span></p>
          <p className="text-gray-500 mt-4">Games, matches, and user management coming soon.</p>
        </div>
      </div>
    </div>
  );
}
