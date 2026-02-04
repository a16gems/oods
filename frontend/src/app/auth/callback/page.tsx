'use client';

import { ConnectBox } from '@phantom/react-sdk';

export default function AuthCallback() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Connecting to Phantom...</h1>
        <p className="text-white/50">Please wait while we complete your authentication</p>
      </div>
      <ConnectBox maxWidth="400px" />
    </div>
  );
}
