'use client';

import { PhantomProvider, darkTheme } from '@phantom/react-sdk';
import { AddressType } from '@phantom/react-sdk';
import { ReactNode } from 'react';

// Extend dark theme with our brand colors
const customTheme = {
  ...darkTheme,
  brand: '#00ff88' as `#${string}`,
  success: '#00ff88' as `#${string}`,
};

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <PhantomProvider
      config={{
        providers: ['google', 'apple', 'injected'],
        appId: 'oods-prediction-app',
        addressTypes: [AddressType.solana],
        authOptions: {
          redirectUrl: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'https://app.oods.to/auth/callback',
        },
      }}
      theme={customTheme}
      appIcon="https://oods.to/favicon.ico"
      appName="Oods"
    >
      {children}
    </PhantomProvider>
  );
}
