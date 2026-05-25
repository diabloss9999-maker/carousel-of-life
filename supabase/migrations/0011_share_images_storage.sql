-- =============================================================================
-- 공유 이미지 임시 저장소 — share-images bucket
--
-- 사용자가 카카오톡 공유 시 화면 캡처 PNG 를 여기에 업로드 →
-- public URL 받아서 Kakao Share SDK 에 imageUrl 로 전달.
--
-- 정리:
--   매일 cron (/api/cron/cleanup-share-images) 으로 24시간 이상 된 파일 자동 삭제.
-- =============================================================================

-- 버킷 생성 (이미 있으면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'share-images',
  'share-images',
  true,                          -- public read
  5 * 1024 * 1024,               -- 최대 5MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS 정책 — 모든 인증 사용자가 자기 폴더에 업로드, 모두가 read 가능
-- 파일 경로 규칙: {user_id}/{timestamp}-{random}.png

-- SELECT (read) — 모두에게 허용 (public bucket)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'share_images_public_read'
  ) THEN
    CREATE POLICY "share_images_public_read"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'share-images');
  END IF;
END $$;

-- INSERT — 인증 사용자가 자기 user_id 폴더에만
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'share_images_authenticated_upload'
  ) THEN
    CREATE POLICY "share_images_authenticated_upload"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'share-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- DELETE — 본인 폴더만 (service_role 은 항상 가능)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'share_images_delete_own'
  ) THEN
    CREATE POLICY "share_images_delete_own"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'share-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;
