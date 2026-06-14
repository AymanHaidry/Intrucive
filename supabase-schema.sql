-- Intrucive Supabase Schema
-- Run this in your Supabase SQL editor

-- Companies
create table public.companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  admin_key text unique not null,
  learner_count int default 0,
  review_mode text default 'manual',
  created_at timestamptz default now()
);

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  role text default 'learner' check (role in ('learner','company_admin','manager','reviewer','viewer','super_admin')),
  department text,
  company_id uuid references public.companies(id) on delete set null,
  xp int default 0,
  streak int default 0,
  last_active timestamptz,
  certified boolean default false,
  certificates_count int default 0,
  created_at timestamptz default now()
);

-- Lesson Progress
create table public.lesson_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  phase_num int not null,
  lesson_title text not null,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique (user_id, phase_num, lesson_title)
);

-- Submissions (screenshot uploads)
create table public.submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  phase_num int not null,
  lesson_name text not null,
  file_url text,
  status text default 'pending' check (status in ('pending','approved','rejected','needs_revision','exceptional')),
  reviewer_id uuid references public.profiles(id),
  reviewer_note text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- Certificates
create table public.certificates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  cert_id text unique not null,
  cert_level text not null,
  description text,
  status text default 'issued' check (status in ('draft','eligible','issued','revoked','expired','reissued')),
  issued_at timestamptz default now(),
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Audit Log
create table public.audit_log (
  id uuid default gen_random_uuid() primary key,
  actor text,
  action text,
  target text,
  company_id uuid references public.companies(id),
  result text default 'success',
  ip text,
  created_at timestamptz default now()
);

-- Storage bucket for submission files
insert into storage.buckets (id, name, public) values ('submissions', 'submissions', true);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.submissions enable row level security;
alter table public.certificates enable row level security;
alter table public.audit_log enable row level security;

-- Profiles: users can read/write their own
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Admins can view all profiles in their company
create policy "Admins view company profiles" on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('company_admin','manager','super_admin')
      and (p.company_id = profiles.company_id or p.role = 'super_admin')
    )
  );

-- Lesson progress: own records
create policy "Own lesson progress" on public.lesson_progress for all using (auth.uid() = user_id);

-- Submissions: own records + admins
create policy "Own submissions" on public.submissions for all using (auth.uid() = user_id);
create policy "Admins view submissions" on public.submissions for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('company_admin','manager','reviewer','super_admin')
    )
  );
create policy "Admins update submissions" on public.submissions for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('company_admin','manager','reviewer','super_admin')
    )
  );

-- Certificates: public read for verification
create policy "Public certificate verification" on public.certificates for select using (true);
create policy "Admins manage certs" on public.certificates for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('company_admin','super_admin')
    )
  );

-- Companies: admins read their own
create policy "Admins view own company" on public.companies for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and (company_id = companies.id or role = 'super_admin')
    )
  );
create policy "Super admin manage companies" on public.companies for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  );

-- Audit log: admins read
create policy "Admins view audit log" on public.audit_log for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('company_admin','manager','super_admin')
    )
  );
create policy "Admins insert audit" on public.audit_log for insert with check (auth.uid() is not null);

-- Storage policy
create policy "Authenticated upload" on storage.objects for insert
  with check (bucket_id = 'submissions' and auth.uid() is not null);
create policy "Public read submissions" on storage.objects for select
  using (bucket_id = 'submissions');

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
