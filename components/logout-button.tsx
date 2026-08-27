"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return <Button variant="ghost" className="mt-2 w-full justify-start px-0 text-slate-300 hover:bg-white/10 hover:text-white" onClick={logout}>Sair</Button>;
}
