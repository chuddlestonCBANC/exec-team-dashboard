-- Create storage bucket for executive headshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'executive-headshots',
  'executive-headshots',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload headshots
CREATE POLICY "Authenticated users can upload headshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'executive-headshots');

-- Allow authenticated users to update their headshots
CREATE POLICY "Authenticated users can update headshots"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'executive-headshots');

-- Allow authenticated users to delete headshots
CREATE POLICY "Authenticated users can delete headshots"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'executive-headshots');

-- Allow public read access to headshots
CREATE POLICY "Public can view headshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'executive-headshots');
