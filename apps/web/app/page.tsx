import { DashboardShell } from "../components/DashboardShell";
import { getDemoCabinet } from "../lib/demo-data";
import { getUserCabinet } from "../lib/data";
import { createSupabaseServerClient } from "../lib/supabase-server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const data = getDemoCabinet();
    return <DashboardShell initialItems={data.items} cabinet={data.cabinet} cabinetId="demo-cabinet" />;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const data = await getUserCabinet(user.id);
  return <DashboardShell initialItems={data.items} cabinet={data.cabinet} cabinetId={data.cabinetId} />;
}
