create table if not exists public.adjustment_item_feedback (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references public.adjustment_demands(id) on delete cascade,
  item_id uuid not null references public.adjustment_items(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  status text not null default 'draft' check (status in ('draft', 'pending', 'resolved')),
  developer_response text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists adjustment_item_feedback_demand_id_idx
  on public.adjustment_item_feedback(demand_id);

create index if not exists adjustment_item_feedback_item_id_idx
  on public.adjustment_item_feedback(item_id);

alter table public.adjustment_item_feedback enable row level security;

create policy "Authenticated users can read item feedback"
  on public.adjustment_item_feedback for select to authenticated using (true);

create policy "Authenticated users can create item feedback"
  on public.adjustment_item_feedback for insert to authenticated with check (true);

create policy "Authenticated users can update item feedback"
  on public.adjustment_item_feedback for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete item feedback"
  on public.adjustment_item_feedback for delete to authenticated using (true);
