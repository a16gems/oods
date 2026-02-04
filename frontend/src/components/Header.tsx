'use client';

import { useEffect, useState } from 'react';
import { useModal, usePhantom, useAccounts, useDisconnect } from '@phantom/react-sdk';
import Link from 'next/link';

const styles = {
  header: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    backgroundColor: '#000',
    borderBottom: '1px solid #222',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 1000,
  },
  logo: {
    color: '#22c55e',
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textDecoration: 'none',
  },
  walletSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  balanceBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #333',
    color: '#fff',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  balanceAmount: {
    color: '#22c55e',
    fontFamily: 'monospace',
  },
  connectBtn: {
    padding: '8px 16px',
    backgroundColor: '#22c55e',
    border: 'none',
    color: '#000',
    fontWeight: 600,
    cursor: 'pointer',
  },
  address: {
    color: '#666',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
};

export function Header() {
  const { open } = useModal();
  const { isConnected, isLoading } = usePhantom();
  const accounts = useAccounts();
  const { disconnect } = useDisconnect();
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const solanaAddress = accounts && accounts.length > 0 ? accounts[0].address : '';
  const truncatedAddress = solanaAddress 
    ? `${solanaAddress.slice(0, 4)}...${solanaAddress.slice(-4)}`
    : '';

  useEffect(() => {
    async function fetchBalance() {
      if (!solanaAddress) {
        setBalance(null);
        return;
      }

      setLoadingBalance(true);
      try {
        const res = await fetch(`/api/balance?address=${solanaAddress}`);
        const data = await res.json();
        if (data.balance !== undefined) {
          setBalance(data.balance);
        }
      } catch (err) {
        console.error('Failed to fetch balance:', err);
      } finally {
        setLoadingBalance(false);
      }
    }

    fetchBalance();
  }, [solanaAddress]);

  const formatBalance = (bal: number) => {
    if (bal >= 1000) {
      return `${(bal / 1000).toFixed(2)}K`;
    }
    return bal.toFixed(4);
  };

  return (
    <header style={styles.header}>
      <Link href="/" style={styles.logo}>
        OODS
      </Link>

      <div style={styles.walletSection}>
        {isLoading ? (
          <span style={{ color: '#666' }}>Loading...</span>
        ) : isConnected ? (
          <Link href="/profile" style={styles.balanceBtn}>
            <span style={styles.balanceAmount}>
              {loadingBalance ? '...' : balance !== null ? `${formatBalance(balance)} SOL` : '-- SOL'}
            </span>
            <span style={styles.address}>{truncatedAddress}</span>
          </Link>
        ) : (
          <button onClick={open} style={styles.connectBtn}>
            CONNECT WALLET
          </button>
        )}
      </div>
    </header>
  );
}
