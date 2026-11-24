-- DESIGN STUDY：PDF に加えて、画像と動画も置けるようにする
-- Supabase の「SQL Editor」に貼り付けて「Run」を押してください。何度実行しても壊れません。
update storage.buckets
set allowed_mime_types = array['application/pdf', 'image/*', 'video/*'],
    file_size_limit = 52428800
where id = 'study-files';
