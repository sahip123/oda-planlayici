-- Bu kodu Supabase SQL Editor'de calistir

alter table public.floorplan_projects
  add column if not exists user_id uuid references auth.users(id);

drop policy if exists "Allow public insert" on public.floorplan_projects;
drop policy if exists "Allow public update" on public.floorplan_projects;

create policy "Users can insert own projects" on public.floorplan_projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on public.floorplan_projects
  for update using (auth.uid() = user_id);

-- "Allow public read" policy'si oldugu gibi kalsin,
-- boylece paylasim linki olan herkes projeyi goruntuleyebilir.
