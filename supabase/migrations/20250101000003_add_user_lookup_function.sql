-- Add user lookup function for finding users by email
-- This function uses SECURITY DEFINER to access auth.users table

CREATE OR REPLACE FUNCTION get_user_by_email(user_email TEXT)
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
  WHERE au.email = user_email
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_by_email(TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_user_by_email(TEXT) IS 'Lookup user by email address. Returns user id, email, and metadata.';

