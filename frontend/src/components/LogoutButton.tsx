'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin-logout', { method: 'POST' });
    router.push('/admin-login');
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-200"
    >
      <LogOut className="w-4 h-4" />
      Logout
    </button>
  );
}

export default LogoutButton;
