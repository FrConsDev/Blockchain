import MyProductComponent from "@/components/my-product-component";

export default function MyProductPage() {
  return (
    <main className="flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">My Product</h1>
      <MyProductComponent />
    </main>
  );
}
