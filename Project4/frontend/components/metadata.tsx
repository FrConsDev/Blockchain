import { ipfsToHttp } from "@/client-config/ipfs";
import { Metadata } from "@/interface/metadata";
import Image from "next/image";

export const MetadataComponent = (productMetadata: Metadata) => {
    return (
        <>
            {productMetadata ? (
                <div className="flex items-center space-x-4">
                    <div>
                        <p><strong>Name:</strong> {productMetadata.name}</p>
                        <p><strong>Description:</strong> {productMetadata.name}</p>
                        <p><strong>Weight:</strong> {productMetadata.weight}</p>
                        <p><strong>Made In:</strong> {productMetadata.madeIn}</p>
                        <p><strong>Dimensions:</strong> {productMetadata.dimension}</p>
                        <p><strong>Composition:</strong> {productMetadata.composition}</p>
                        <p><strong>Care Instructions:</strong> {productMetadata.careInstructions}</p>
                        <p><strong>Eco Data:</strong> {productMetadata.ecoData}</p>
                        <p>
                            <strong>After-Sales URL:</strong>{" "}
                            <a href={productMetadata.afterSalesUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                {productMetadata.afterSalesUrl}
                            </a>
                        </p>
                        <p><strong>Recycling:</strong> {productMetadata.recycling}</p>
                        <p><strong>Drop-Off Location:</strong> {productMetadata.dropOffLocation}</p>
                    </div>
                    <Image
                        src={ipfsToHttp(productMetadata.photo)}
                        alt={productMetadata.name}
                        className="w-400 h-400 object-cover rounded-md"
                        width={400}
                        height={400}
                    />
                </div>
            ) : (
                <p className="text-gray-500">An error occurred...</p>
            )}
        </>
    );
};
