import DashboardClient from "./DashboardClient";

export default async function OwnerDashboardPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;

  return <DashboardClient shopSlug={shopSlug} />;
}
