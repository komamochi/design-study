-- DESIGN STUDY のデータベース設定
-- Supabase の「SQL Editor」に全部貼り付けて「Run」を押すと作られます。
-- Web Archive・ひとりガントと同じ Supabase プロジェクトに追加して使います。何度実行しても壊れません。

-- 進捗（完了・学習中・表示の切り替え）：ユーザーごとに1行
create table if not exists public.study_data (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 貼り付けた教材：チャプターごとに1行
create table if not exists public.study_contents (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  chapter_id text not null,
  body text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, chapter_id)
);

-- 自分のデータだけ読み書きできるようにする
alter table public.study_data enable row level security;
alter table public.study_contents enable row level security;

drop policy if exists "own rows" on public.study_data;
create policy "own rows" on public.study_data for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own rows" on public.study_contents;
create policy "own rows" on public.study_contents for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
