import { useEffect, useState } from "react";
import { ipfsToHttp } from "@/client-config/ipfs";
import { Metadata } from "@/interface/metadata";

export const useFetchMetadata = (products: { publicId: string; metadataURI: string }[]) => {
    const [metadataList, setMetadataList] = useState<Record<string, Metadata>>({});

    useEffect(() => {
        if (!products || products.length === 0) return;

        const fetchMetadata = async () => {
            const metadataMap: Record<string, Metadata> = {};
            await Promise.all(
                products.map(async (product) => {
                    try {
                        const url = ipfsToHttp(product.metadataURI);
                        const response = await fetch(url);
                        if (response.ok) {
                            const metadata: Metadata = await response.json();
                            metadataMap[product.publicId] = metadata;
                        }
                    } catch (error) {
                        console.error("Error on fetch metadata:", error);
                    }
                })
            );
            setMetadataList(metadataMap);
        };

        fetchMetadata();
    }, [products]);

    return metadataList;
};
