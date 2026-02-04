import { NextRequest, NextResponse } from 'next/server';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const PUBLIC_RPC = 'https://api.mainnet-beta.solana.com';

async function fetchBalance(rpcUrl: string, address: string) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [address],
    }),
  });
  return response.json();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  try {
    // Try Helius first if key exists
    let data;
    if (HELIUS_API_KEY) {
      data = await fetchBalance(HELIUS_RPC, address);
      
      // If Helius fails (rate limit, etc), fallback to public RPC
      if (data.error) {
        console.log('Helius failed, trying public RPC:', data.error.message);
        data = await fetchBalance(PUBLIC_RPC, address);
      }
    } else {
      // No Helius key, use public RPC
      data = await fetchBalance(PUBLIC_RPC, address);
    }

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    // Convert lamports to SOL (1 SOL = 1e9 lamports)
    const solBalance = (data.result?.value || 0) / 1e9;

    return NextResponse.json({ 
      address,
      balance: solBalance,
      lamports: data.result?.value || 0,
    });
  } catch (error) {
    console.error('RPC error:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}
