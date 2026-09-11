-- Earlier versions of the feedback workflow removed the item's completion marker.
-- Feedback now blocks confirmation independently, so restore completion for those items.
update public.adjustment_items as item
set semantics = case
  when jsonb_typeof(item.semantics) = 'array' then item.semantics || '["done"]'::jsonb
  else '["done"]'::jsonb
end,
updated_at = now()
where exists (
  select 1
  from public.adjustment_item_feedback as feedback
  where feedback.item_id = item.id
)
and not exists (
  select 1
  from jsonb_array_elements(
    case when jsonb_typeof(item.semantics) = 'array' then item.semantics else '[]'::jsonb end
  ) as marker
  where marker = '"done"'::jsonb
     or (jsonb_typeof(marker) = 'object' and marker->>'semantic' in ('done', 'completion'))
);
