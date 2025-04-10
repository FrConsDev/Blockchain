"use client";
import React from 'react';
import { useAccount, useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/constants';
import { MetadataComponent } from './metadata';
import { useFetchMetadata } from '@/services/fetch-metadata';

const MyProductComponent = () => {
    const { address } = useAccount();
    
    const { data: products, error, isError, isLoading } = useReadContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "getProductsByOwner",
        args: [address as `0x${string}`],
    });

    const metadataList = useFetchMetadata(
        products ? products.map(({ publicId, metadataURI }) => ({ publicId, metadataURI })) : []
    );

    if (isLoading) {
        return <p className="text-gray-500">Loading...</p>;
    }

    if (isError) {
        return <p className="text-red-500">Error: {error?.message}</p>;
    }

    if (!products || products.length === 0) {
        return <p className="text-gray-500">Any product found</p>;
    }

    return (
        <div className="flex flex-col items-center space-y-5 p-5 gap-5 w-full max-w-screen-lg mx-auto">
            {products.map((product, index) => (
                <div key={index} className="border p-4 rounded-md w-full bg-gray-100">
                    <p><strong>Numéro de série:</strong> {product.serialNumber}</p>
                    <p><strong>Identifiant public:</strong> {product.publicId}</p>
                    <p><strong>Entreprise:</strong> {product.enterprise}</p>
                    <p><strong>Réclamé:</strong> {product.isClaimed ? "Oui" : "Non"}</p>
                   {product && metadataList[product.publicId] ? (
                               <MetadataComponent {...metadataList[product.publicId]} />
                             ) : product ? (
                               <p className="text-gray-500">Loading metadata...</p>
                             ) : null}
                </div>
            ))}
        </div>
    );
};

export default MyProductComponent;
