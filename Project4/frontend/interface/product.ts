export interface Product {
  serialNumber: string;
  publicId: string;
  metadataURI: string;
  enterprise?: string;
  isClaimed: boolean;
}