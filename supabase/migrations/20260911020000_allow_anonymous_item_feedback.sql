grant select, insert, update, delete
  on table public.adjustment_item_feedback
  to anon, authenticated;

drop policy if exists "Anonymous users can read item feedback" on public.adjustment_item_feedback;
drop policy if exists "Anonymous users can create item feedback" on public.adjustment_item_feedback;
drop policy if exists "Anonymous users can update item feedback" on public.adjustment_item_feedback;
drop policy if exists "Anonymous users can delete item feedback" on public.adjustment_item_feedback;

create policy "Anonymous users can read item feedback"
  on public.adjustment_item_feedback for select
  to anon
  using (true);

create policy "Anonymous users can create item feedback"
  on public.adjustment_item_feedback for insert
  to anon
  with check (true);

create policy "Anonymous users can update item feedback"
  on public.adjustment_item_feedback for update
  to anon
  using (true)
  with check (true);

create policy "Anonymous users can delete item feedback"
  on public.adjustment_item_feedback for delete
  to anon
  using (true);
