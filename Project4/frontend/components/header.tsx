"use client";
import { useEffect, useState } from 'react';
import { ConnectButton } from "@rainbow-me/rainbowkit"
import Image from "next/image";
import { Button } from './ui/button';
import Link from 'next/link';


const Header = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <div className="bg-[#8D906F] text-white flex justify-between items-center p-5">
      <div className=" flex justify-between items-center gap-5">
        <Image src="/CC.png" alt="DApp Logo" width={48} height={48} />
        <p className="text-lg">ChainCert Dapp</p>
        <Button className="bg-[#212F3C] w-full mt-4" asChild>
          <Link href="/product-details">Product details</Link>
        </Button>
        <Button className="bg-[#212F3C] w-full mt-4" asChild>
          <Link href="/claim">Claim a product</Link>
        </Button>
        <Button className="bg-[#212F3C] w-full mt-4" asChild>
          <Link href="/my-product">My product</Link>
        </Button>
      </div>
      <div className=" flex justify-between items-center gap-5">
        {mounted ? <ConnectButton /> : <p>Loading...</p>}
      </div>
    </div>
  )
}

export default Header