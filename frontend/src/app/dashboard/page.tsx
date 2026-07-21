import RealtimeList from '@/components/RealtimeList';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';
import LogoutButton from '@/components/LogoutButton';

async function Page() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('awaaj_admin_session')?.value === 'true';

  if (!isAdmin) {
    redirect('/admin-login');
  }

  return (
    <div className="flex-1 bg-gradient-to-b from-red-50/50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Manage and review all reported cases.
            </p>
          </div>
          <LogoutButton />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <RealtimeList />
        </div>
      </div>
    </div>
  );
}

export default Page;
