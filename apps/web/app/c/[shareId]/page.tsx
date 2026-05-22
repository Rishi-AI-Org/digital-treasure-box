import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicCabinet } from "../../../components/PublicCabinet";
import { getPublicCabinetByShareId } from "../../../lib/data";

interface PublicCabinetPageProps {
  params: Promise<{ shareId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Private Cabinet",
    robots: {
      index: false,
      follow: false,
      nocache: true
    }
  };
}

export default async function PublicCabinetPage({ params }: PublicCabinetPageProps) {
  const { shareId } = await params;
  const data = await getPublicCabinetByShareId(shareId);
  if (!data) {
    notFound();
  }

  return <PublicCabinet cabinet={data.cabinet} items={data.items} />;
}
