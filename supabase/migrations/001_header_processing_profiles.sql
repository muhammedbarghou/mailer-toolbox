-- Create header_processing_profiles table
CREATE TABLE IF NOT EXISTS header_processing_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  custom_headers JSONB DEFAULT '[]'::jsonb,
  processing_config JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create header_profile_parameters junction table
-- Note: Foreign key to user_header_parameters will be added if that table exists
CREATE TABLE IF NOT EXISTS header_profile_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES header_processing_profiles(id) ON DELETE CASCADE,
  parameter_id UUID NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, parameter_id)
);

-- Add foreign key constraint to user_header_parameters if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_header_parameters') THEN
    IF NOT EXISTS (
      SELECT FROM pg_constraint 
      WHERE conname = 'fk_header_profile_parameters_parameter_id'
    ) THEN
      ALTER TABLE header_profile_parameters
      ADD CONSTRAINT fk_header_profile_parameters_parameter_id
      FOREIGN KEY (parameter_id) REFERENCES user_header_parameters(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_header_profiles_user_id ON header_processing_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_header_profiles_default ON header_processing_profiles(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_profile_parameters_profile_id ON header_profile_parameters(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_parameters_parameter_id ON header_profile_parameters(parameter_id);

-- Enable Row Level Security
ALTER TABLE header_processing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE header_profile_parameters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for header_processing_profiles
CREATE POLICY "Users can view their own profiles"
  ON header_processing_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profiles"
  ON header_processing_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
  ON header_processing_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles"
  ON header_processing_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for header_profile_parameters
CREATE POLICY "Users can view profile parameters for their profiles"
  ON header_profile_parameters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM header_processing_profiles
      WHERE header_processing_profiles.id = header_profile_parameters.profile_id
      AND header_processing_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert profile parameters for their profiles"
  ON header_profile_parameters
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM header_processing_profiles
      WHERE header_processing_profiles.id = header_profile_parameters.profile_id
      AND header_processing_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update profile parameters for their profiles"
  ON header_profile_parameters
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM header_processing_profiles
      WHERE header_processing_profiles.id = header_profile_parameters.profile_id
      AND header_processing_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete profile parameters for their profiles"
  ON header_profile_parameters
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM header_processing_profiles
      WHERE header_processing_profiles.id = header_profile_parameters.profile_id
      AND header_processing_profiles.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_header_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_header_profiles_updated_at
  BEFORE UPDATE ON header_processing_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_header_profile_updated_at();
