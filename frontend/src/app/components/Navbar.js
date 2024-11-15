// components/Navbar.js
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between">
        <Link legacyBehavior href="/">
          <a className="text-lg font-bold">Car Management</a>
        </Link>
        <div>
          {session ? (
            <>
              <Link legacyBehavior href="/cars/create">
                <a className="mr-4">Add Car</a>
              </Link>
              <button onClick={() => signOut()} className="bg-red-500 px-3 py-1 rounded">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link legacyBehavior href="/auth/login">
                <a className="mr-4">Login</a>
              </Link>
              <Link legacyBehavior href="/auth/register">
                <a className="bg-blue-500 px-3 py-1 rounded">Sign Up</a>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
