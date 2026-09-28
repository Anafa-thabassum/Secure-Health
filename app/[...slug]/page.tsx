import { SecureHealthApp } from "@/components/securehealth-app";

export default async function CatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return <SecureHealthApp path={`/${slug.join("/")}`} />;
}
