alter table public.adjustment_item_feedback
  drop constraint if exists adjustment_item_feedback_status_check;

alter table public.adjustment_item_feedback
  add constraint adjustment_item_feedback_status_check
  check (status in ('draft', 'pending', 'resolved'));

alter table public.adjustment_item_feedback
  alter column status set default 'draft';
