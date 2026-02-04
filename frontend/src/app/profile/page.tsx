'use client';

import { useEffect, useState } from 'react';
import { usePhantom, useAccounts, useDisconnect, useModal } from '@phantom/react-sdk';
import Link from 'next/link';
import { Header } from '@/components/Header';

const styles = {
  main: {
    minHeight: '100vh',
    backgroundColor: '#000',
    paddingTop: '80px',
    padding: '80px 24px 24px',
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  title: {
    color: '#fff',
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '32px',
  },
  card: {
    backgroundColor: '#000',
    border: '1px solid #333',
    padding: '24px',
    marginBottom: '16px',
  },
  label: {
    color: '#666',
    fontSize: '12px',
    letterSpacing: '0.05em',
    marginBottom: '8px',
    display: 'block',
  },
  value: {
    color: '#fff',
    fontSize: '18px',
    fontFamily: 'monospace',
    wordBreak: 'break-all' as const,
  },
  balanceValue: {
    color: '#22c55e',
    fontSize: '32px',
    fontFamily: 'monospace',
  },
  disconnectBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: 'transparent',
    border: '1px solid #ef4444',
    color: '#ef4444',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '24px',
  },
  backLink: {
    color: '#666',
    textDecoration: 'none',
    fontSize: '14px',
    display: 'inline-block',
    marginBottom: '24px',
  },
  notConnected: {
    textAlign: 'center' as const,
    padding: '48px',
  },
  connectBtn: {
    padding: '16px 32px',
    backgroundColor: '#22c55e',
    border: 'none',
    color: '#000',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '16px',
  },
};

export default function ProfilePage() {
  const { isConnected, isLoading } = usePhantom();
  const accounts = useAccounts();
  const { disconnect } = useDisconnect();
  const { open } = useModal();
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const solanaAddress = accounts && accounts.length > 0 ? accounts[0].address : '';

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

  const handleDisconnect = () => {
    disconnect();
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main style={styles.main}>
          <div style={styles.container}>
            <p style={{ color: '#666' }}>Loading...</p>
          </div>
        </main>
      </>
    );
  }

  if (!isConnected) {
    return (
      <>
        <Header />
        <main style={styles.main}>
          <div style={styles.container}>
            <div style={styles.notConnected}>
              <p style={{ color: '#666', marginBottom: '16px' }}>Wallet not connected</p>
              <button onClick={open} style={styles.connectBtn}>
                CONNECT WALLET
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={styles.main}>
        <div style={styles.container}>
          <Link href="/" style={styles.backLink}>
            ← Back to app
          </Link>
          
          <h1 style={styles.title}>PROFILE</h1>

          {/* Balance Card */}
          <div style={styles.card}>
            <label style={styles.label}>SOL BALANCE</label>
            <div style={styles.balanceValue}>
              {loadingBalance ? '...' : balance !== null ? balance.toFixed(4) : '--'} SOL
            </div>
          </div>

          {/* Address Card */}
          <div style={styles.card}>
            <label style={styles.label}>WALLET ADDRESS</label>
            <div style={styles.value}>{solanaAddress}</div>
          </div>

          {/* Network Card */}
          <div style={styles.card}>
            <label style={styles.label}>NETWORK</label>
            <div style={styles.value}>Solana Mainnet</div>
          </div>

          {/* Disconnect Button */}
          <button onClick={handleDisconnect} style={styles.disconnectBtn}>
            DISCONNECT WALLET
          </button>
        </div>
      </main>
    </>
  );
}
