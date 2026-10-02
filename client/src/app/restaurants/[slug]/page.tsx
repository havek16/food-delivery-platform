import RestaurantClient from "./RestaurantClient";

export default async function RestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RestaurantClient slug={slug} />;
}
