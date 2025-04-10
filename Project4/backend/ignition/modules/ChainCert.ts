import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ChainCertModule = buildModule("ChainCertModule", (m) => {
  const chainCert = m.contract("ChainCert");

  const owner = m.getAccount(0);
  const ipfsData = [
    "bafkreigxbqoq2gbym5r2kaiebdfjwdtz4jwi3lvxhggtg37ybb6c6qxqza",
    "bafkreiezwxzlznbok66crtsp3ewfz4asbafmoer6zcublpbd7ncdcb2nkq",
    "bafkreignds3b3mu6fxe6tyjz6zk4c7s3hxukarrttizfv3mizcbpqzpbvq"]

  for (let i = 0; i < 3; i++) {
    const serialNumber = `SN-${Date.now()}-${i}`;
    const publicId = `PID-${Date.now()}-${i}`;

    const uniqueId = `mintProductDate${Date.now()}Count${i}`;

    console.log(`Serial Number: ${serialNumber}, Public ID: ${publicId}`);

    m.call(chainCert, "mintProduct", [owner, ipfsData[i], serialNumber, publicId], {
      from: owner,
      id: uniqueId,
    });
  }

  return { chainCert };
});

export default ChainCertModule;
