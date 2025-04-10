import ProductDetailsComponent from "@/components/product-details-component";

export default function ProductDetailsPage() {
  return (
    <main className="flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Product Details</h1>
      <ProductDetailsComponent />
    </main>
  );
}
