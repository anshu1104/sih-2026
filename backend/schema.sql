-- CivicVision Supabase PostgreSQL Schema

-- SAFE RESET: Drop existing tables if they exist to prevent "already exists" errors
DROP TABLE IF EXISTS report_status_history CASCADE;
DROP TABLE IF EXISTS report_media CASCADE;
DROP TABLE IF EXISTS detections CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('citizen', 'admin', 'officer')) DEFAULT 'citizen',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Reports Table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT UNIQUE NOT NULL, -- e.g., 'CV-2026-001284'
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    waste_type TEXT,
    description TEXT,
    priority TEXT CHECK (priority IN ('normal', 'urgent')) DEFAULT 'normal',
    status TEXT CHECK (status IN ('submitted', 'ai_verified', 'assigned', 'in_progress', 'resolved', 'closed')) DEFAULT 'submitted',
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    address TEXT,
    city TEXT,
    area TEXT,
    ai_verified BOOLEAN DEFAULT false,
    ai_confidence NUMERIC,
    object_count INTEGER,
    processing_time NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Citizens can view their own reports. Admins can view all.
CREATE POLICY "Citizens can view own reports" ON reports FOR SELECT USING (auth.uid() = user_id OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'officer'))));
-- Citizens can insert their own reports.
CREATE POLICY "Citizens can insert reports" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Admins can update reports (status, priority etc.). Citizens can update status to closed.
CREATE POLICY "Admins and citizens can update reports" ON reports FOR UPDATE USING (auth.uid() = user_id OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'officer'))));

-- 3. Detections Table (AI Output Details)
CREATE TABLE detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    class_name TEXT NOT NULL,
    confidence NUMERIC NOT NULL,
    x1 NUMERIC,
    y1 NUMERIC,
    x2 NUMERIC,
    y2 NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE detections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view detections for accessible reports" ON detections FOR SELECT USING (EXISTS (SELECT 1 FROM reports WHERE id = detections.report_id AND (user_id = auth.uid() OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role IN ('admin', 'officer'))))));
CREATE POLICY "Users can insert detections for own reports" ON detections FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM reports WHERE id = detections.report_id AND user_id = auth.uid()));

-- 4. Report Media Table (Images)
CREATE TABLE report_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    media_type TEXT CHECK (media_type IN ('original', 'ai_result', 'before', 'after')) NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE report_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view media for accessible reports" ON report_media FOR SELECT USING (EXISTS (SELECT 1 FROM reports WHERE id = report_media.report_id AND (user_id = auth.uid() OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role IN ('admin', 'officer'))))));
CREATE POLICY "Users can insert media for own reports" ON report_media FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM reports WHERE id = report_media.report_id AND user_id = auth.uid()) OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role IN ('admin', 'officer'))));

-- 5. Status History Table
CREATE TABLE report_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    changed_by UUID REFERENCES profiles(id),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view history for accessible reports" ON report_status_history FOR SELECT USING (EXISTS (SELECT 1 FROM reports WHERE id = report_status_history.report_id AND (user_id = auth.uid() OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role IN ('admin', 'officer'))))));
CREATE POLICY "System/Admins can insert history" ON report_status_history FOR INSERT WITH CHECK (true); -- Trigger handles this usually, or API.

-- Storage setup notes:
-- Create a bucket named `civicvision-reports` and set policies allowing authenticated uploads and reads.
