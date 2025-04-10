import { createPublicClient, http, PublicClient } from "viem";
import { hardhat, sepolia } from "viem/chains";

let publicClient: PublicClient;

console.log("SEPOLIA KEY IS PRESENT = ", !!process.env.ALCH_KEY);
console.log("NEXT_PUBLIC_BLOCKCHAIN = ", process.env.NEXT_PUBLIC_BLOCKCHAIN);

if (process.env.NEXT_PUBLIC_BLOCKCHAIN === 'hardhat') {
  
  publicClient = createPublicClient({ 
    chain: hardhat,
    transport: http()
  });
  
} else {

  publicClient = createPublicClient({ 
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/YQgEOSE5qRyYwg78WImk-WrECVuUIblt`)
  });

}


export { publicClient }