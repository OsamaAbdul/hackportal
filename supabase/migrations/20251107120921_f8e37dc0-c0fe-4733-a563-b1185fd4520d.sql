-- Create storage bucket for pitch files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pitch-files',
  'pitch-files',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint']
);

-- Storage policies for pitch files
CREATE POLICY "Users can upload their own pitch files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pitch-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own pitch files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pitch-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Organizers can view pitch files for their hackathons"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pitch-files' AND
  EXISTS (
    SELECT 1 FROM submissions s
    JOIN hackathons h ON s.hackathon_id = h.id
    WHERE h.organizer_id = auth.uid()
    AND (storage.foldername(name))[2] = s.id::text
  )
);

-- Add pitch_file_url column to submissions table
ALTER TABLE submissions
ADD COLUMN pitch_file_url TEXT;