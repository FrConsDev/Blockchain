"use client";
import React, { useMemo, useState } from 'react';
import { Button } from './ui/button';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/constants';
import { Input } from './ui/input';
import { Product } from '@/interface/product';
import { MetadataComponent } from './metadata';
import { useFetchMetadata } from '@/services/fetch-metadata';
import { usePublicClient } from 'wagmi';

const ProductDetailsComponent = () => {
  const [inputIdOrSerial, setInputIdOrSerial] = useState("");
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const publicClient = usePublicClient();

  const memoizedProductArray = useMemo(() => {
    return productDetails
      ? [{ publicId: productDetails.publicId, metadataURI: productDetails.metadataURI }]
      : [];
  }, [productDetails]);

  const handleGetDetails = async () => {
    if (!inputIdOrSerial) {
      setErrorMessage("Please enter a public identifier or serial number.");
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const product = await publicClient!.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "getProductDetailsByPublicId",
        args: [inputIdOrSerial],
      });

      if (product) {
        setProductDetails(product as Product);
      } else {
        setErrorMessage("Product not found.");
      }
    } catch (error: unknown) {
      console.error("Error :", error);
        setErrorMessage(error instanceof Error ? `Erreur : ${error.message}`: "An error occured");
    } finally {
      setIsLoading(false);
    }
  };

  const metadataList = useFetchMetadata(memoizedProductArray);

  return (
    <div className="flex flex-col items-center space-y-5 p-5 gap-5 w-full max-w-screen-lg mx-auto">
      <Input
        type="string"
        id="address"
        placeholder="Public ID or serial Number"
        onChange={(e) => setInputIdOrSerial(e.target.value)}
      />
      <Button
        onClick={handleGetDetails}
        disabled={isLoading || !inputIdOrSerial}
        className="bg-[#212F3C] w-full mt-4"
      >
        {isLoading ? <span style={{ color: "white" }}>Loading...</span> : <span style={{ color: "white" }}>Get details</span>}
      </Button>

      {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}

      {productDetails && !errorMessage && (
        <div>
          <p><strong>Serial Number:</strong> {productDetails.serialNumber}</p>
          <p><strong>Public ID:</strong> {productDetails.publicId}</p>
          <p><strong>Enterprise:</strong> {productDetails.enterprise}</p>
          <p><strong>Claimed:</strong> {productDetails.isClaimed ? "Yes" : "No"}</p>
          {productDetails && metadataList[productDetails.publicId] ? (
            <MetadataComponent {...metadataList[productDetails.publicId]} />
          ) : productDetails ? (
            <p className="text-gray-500">Loading metadata...</p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ProductDetailsComponent;
