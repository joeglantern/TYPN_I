-- Drop existing programs table if it exists
DROP TABLE IF EXISTS programs CASCADE;

-- Create enhanced programs table
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Active', 'Upcoming', 'Completed')),
    duration TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    start_date DATE,
    end_date DATE,
    capacity INTEGER DEFAULT 0,
    enrolled INTEGER DEFAULT 0,
    instructor_name TEXT,
    instructor_bio TEXT,
    instructor_image TEXT,
    location TEXT,
    schedule TEXT,
    prerequisites TEXT[],
    learning_outcomes TEXT[],
    syllabus JSONB,
    category TEXT NOT NULL DEFAULT 'General',
    level TEXT CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'All Levels')),
    is_featured BOOLEAN DEFAULT false,
    registration_open BOOLEAN DEFAULT false,
    registration_deadline DATE,
    tags TEXT[],
    materials_included TEXT[],
    certification_offered BOOLEAN DEFAULT false,
    certification_details TEXT,
    language TEXT DEFAULT 'English',
    format TEXT CHECK (format IN ('In-Person', 'Online', 'Hybrid')),
    video_url TEXT,
    faqs JSONB
);

-- Add indexes for better performance
CREATE INDEX programs_status_idx ON programs(status);
CREATE INDEX programs_category_idx ON programs(category);
CREATE INDEX programs_level_idx ON programs(level);
CREATE INDEX programs_is_featured_idx ON programs(is_featured);

-- Enable Row Level Security
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON programs
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Enable write access for authenticated users" ON programs
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create program_enrollments table
CREATE TABLE IF NOT EXISTS program_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Completed', 'Withdrawn')),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress INTEGER DEFAULT 0,
    notes TEXT,
    UNIQUE(program_id, user_id)
);

-- Add indexes for program_enrollments
CREATE INDEX program_enrollments_program_id_idx ON program_enrollments(program_id);
CREATE INDEX program_enrollments_user_id_idx ON program_enrollments(user_id);
CREATE INDEX program_enrollments_status_idx ON program_enrollments(status);

-- Enable RLS for program_enrollments
ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies for program_enrollments
CREATE POLICY "Users can view their own enrollments" ON program_enrollments
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can enroll themselves" ON program_enrollments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        (
            SELECT registration_open
            FROM programs
            WHERE id = program_id
        )
    );

-- Create function to handle program enrollment
CREATE OR REPLACE FUNCTION enroll_in_program(
    p_program_id UUID,
    p_user_id UUID
)
RETURNS program_enrollments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_program programs;
    v_enrollment program_enrollments;
BEGIN
    -- Get program details
    SELECT * INTO v_program
    FROM programs
    WHERE id = p_program_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Program not found';
    END IF;
    
    -- Check if registration is open
    IF NOT v_program.registration_open THEN
        RAISE EXCEPTION 'Registration is closed for this program';
    END IF;
    
    -- Check capacity
    IF v_program.enrolled >= v_program.capacity AND v_program.capacity > 0 THEN
        RAISE EXCEPTION 'Program is at full capacity';
    END IF;
    
    -- Create enrollment
    INSERT INTO program_enrollments (
        program_id,
        user_id,
        status
    ) VALUES (
        p_program_id,
        p_user_id,
        'Pending'
    )
    RETURNING * INTO v_enrollment;
    
    -- Update enrolled count
    UPDATE programs
    SET enrolled = enrolled + 1
    WHERE id = p_program_id;
    
    RETURN v_enrollment;
END;
$$; 