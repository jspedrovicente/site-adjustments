import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { NewDemandForm } from "@/components/new-demand-form";
import { createDemand } from "../actions";
export default async function NewDemandPage() { const supabase = await createClient(); const { data, error } = await supabase.from("adjustment_categories").select("id,name").order("name"); if (error) throw new Error(`Não foi possível carregar as categorias: ${error.message}`); return <><PageHeader eyebrow="Cadastro" title="Nova demanda" description="Crie a demanda e seus itens. Ela será encaminhada para análise."/><main className="p-5 sm:p-8 lg:p-10"><NewDemandForm categories={data ?? []} action={createDemand}/></main></>; }
