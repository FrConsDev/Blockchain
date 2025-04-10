import ClaimProductComponent from "@/components/claim-product-component";

export default function ClaimPage() {
  return (
    <main className="flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Claim a product</h1>
      <ClaimProductComponent />
    </main>
  );
}
