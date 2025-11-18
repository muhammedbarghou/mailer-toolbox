-- Add user lookup function for finding users by ID
-- This function uses SECURITY DEFINER to access auth.users table

CREATE OR REPLACE FUNCTION get_user_by_id(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  raw_user_meta_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::TEXT,
    au.raw_user_meta_data
  FROM auth.users au
  WHERE au.id = user_id
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_by_id(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_user_by_id(UUID) IS 'Lookup user by ID. Returns user id, email, and metadata.';

