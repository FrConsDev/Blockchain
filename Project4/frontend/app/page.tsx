'use client';
import NotConnected from "@/components/not-connected";
import ChainCertSystem from "@/components/system";
import { useAccount } from 'wagmi';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <>
      {isConnected ? (
        <ChainCertSystem />
      ) : (
        <NotConnected />
      )}
    </>
  );
}