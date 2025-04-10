import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { hardhat, sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';
import { http } from 'viem';

console.log("SEPOLIA KEY IS PRESENT = ", !!process.env.ALCH_KEY);

const customSepolia = defineChain({
  id: 11155111,
  name: 'Sepolia',
  network: 'sepolia',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [`https://eth-sepolia.g.alchemy.com/v2/YQgEOSE5qRyYwg78WImk-WrECVuUIblt`],
    },
    public: {
      http: [`https://eth-sepolia.g.alchemy.com/v2/YQgEOSE5qRyYwg78WImk-WrECVuUIblt`],
    },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
  testnet: true,
});



export const config = getDefaultConfig({
    appName: 'ChainCert',
    projectId: '14lstgt84q6kwafq',
    chains: [customSepolia, hardhat],
    transports: {
      [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/YQgEOSE5qRyYwg78WImk-WrECVuUIblt`),
      [hardhat.id]: http('http://127.0.0.1:8545'),
    },
    ssr: true,
  });