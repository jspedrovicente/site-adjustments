alter table public.adjustment_demands
add column if not exists in_production boolean not null default false;
