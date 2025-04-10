"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { useWriteContract } from "wagmi";
import { parseAbiItem } from "viem";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/constants";
import { Input } from "./ui/input";
import { Product } from "@/interface/product";
import { MetadataComponent } from "./metadata";
import { useFetchMetadata } from "@/services/fetch-metadata";
import { publicClient } from "@/client-config/public-client";

const ClaimProductComponent = () => {
  const [inputAddress, setInputAddress] = useState("");
  const [claimedProduct, setClaimedProduct] = useState<Product | null>(null);

  const { data, error, isPending, writeContract } = useWriteContract();

  const memoizedProductArray = useMemo(() => {
    return claimedProduct
      ? [{ publicId: claimedProduct.publicId, metadataURI: claimedProduct.metadataURI }]
      : [];
  }, [claimedProduct]);

  const handleClaim = async () => {
    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "claimProduct",
      args: [inputAddress],
    });
  };

  useEffect(() => {
    const fetchClaimedProducts = async () => {
      if (!data) return;

      try {
        const claimedEvents = await publicClient.getLogs({
          address: CONTRACT_ADDRESS as `0x${string}`,
          event: parseAbiItem("event ProductClaimed(address indexed buyer, uint256 indexed tokenId, string serialNumber, string publicId, string metadataURI, bool isClaimed)"),
          fromBlock: BigInt(0),
          toBlock: "latest",
        });
        if (claimedEvents.length > 0) {
          const { args } = claimedEvents[claimedEvents.length - 1];
          setClaimedProduct({
            serialNumber: args.serialNumber || 'An error occurred',
            publicId: args.publicId || 'An error occurred',
            metadataURI: args.metadataURI || 'An error occurred',
            isClaimed: !!args.isClaimed,
          });
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des logs:", err);
      }
    };

    fetchClaimedProducts();
  }, [data]);

  const metadataList = useFetchMetadata(memoizedProductArray);

  return (
    <div className="flex flex-col items-center space-y-5 p-5 gap-5 w-full max-w-screen-lg mx-auto">
      <Input
        type="string"
        id="address"
        placeholder="Serial number"
        onChange={(e) => setInputAddress(e.target.value)}
      />
      <Button
        onClick={handleClaim}
        disabled={isPending || !inputAddress}
        className="bg-[#212F3C] w-full mt-4"
      >
        {isPending ? <span className="text-white">Loading...</span> : <span className="text-white">Claim my product</span>}
      </Button>
      {error && <p className="text-red-500 mt-2">Error : {error.message}</p>}
      {claimedProduct && (
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>Congratulations, you are the owner of:</h1>
          <p><strong>Serial Number:</strong> {claimedProduct.serialNumber}</p>
          <p><strong>Public ID:</strong> {claimedProduct.publicId}</p>
          <p><strong>Enterprise:</strong> {claimedProduct.enterprise}</p>
          <p><strong>Claimed:</strong> {claimedProduct.isClaimed ? "Yes" : "No"}</p>
          {claimedProduct && metadataList[claimedProduct.publicId] ? (
            <MetadataComponent {...metadataList[claimedProduct.publicId]} />
          ) : claimedProduct ? (
            <p className="text-gray-500">Loading metadata...</p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ClaimProductComponent;
