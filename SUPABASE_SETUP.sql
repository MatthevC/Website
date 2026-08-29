create table events (
 id uuid primary key,
 title text not null,
 date date not null,
 endDate date,
 excerpt text,
 content text,
 image text,
 created_at timestamptz default now()
);
alter table events enable row level security;
create policy "public read events" on events for select using (true);
-- dodawanie tylko po zalogowaniu
create policy "admin insert events" on events for insert to authenticated with check (true);
