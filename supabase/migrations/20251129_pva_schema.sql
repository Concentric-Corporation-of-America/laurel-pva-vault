-- Laurel County PVA Document Management System
-- Database Schema with Federal Security Requirements
-- Created: 2025-11-29

-- Create enum for user roles (9-level hierarchy)
CREATE TYPE public.user_role AS ENUM (
  'pva_admin',
  'deputy_pva',
  'senior_appraiser',
  'appraiser',
  'clerical_staff',
  'it_staff',
  'board_member',
  'taxpayer',
  'public'
);

-- Create enum for permission levels
CREATE TYPE public.permission_level AS ENUM (
  'none',
  'read',
  'write',
  'admin'
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'public',
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Create function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'pva_admin' THEN 1
    WHEN 'deputy_pva' THEN 2
    WHEN 'senior_appraiser' THEN 3
    WHEN 'appraiser' THEN 4
    WHEN 'clerical_staff' THEN 5
    WHEN 'it_staff' THEN 6
    WHEN 'board_member' THEN 7
    WHEN 'taxpayer' THEN 8
    WHEN 'public' THEN 9
  END
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "PVA admin can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'pva_admin'));

CREATE POLICY "PVA admin can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'pva_admin'))
WITH CHECK (public.has_role(auth.uid(), 'pva_admin'));

-- Create storage_buckets table
CREATE TABLE public.storage_buckets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  retention_period TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.storage_buckets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view buckets"
ON public.storage_buckets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only PVA admin can manage buckets"
ON public.storage_buckets FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'pva_admin'))
WITH CHECK (public.has_role(auth.uid(), 'pva_admin'));

-- Create folders table
CREATE TABLE public.folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_id UUID NOT NULL REFERENCES public.storage_buckets(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bucket_id, path)
);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view folders based on bucket permissions"
ON public.folders FOR SELECT
TO authenticated
USING (true);

-- Create files table
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  bucket_id UUID NOT NULL REFERENCES public.storage_buckets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  storage_path TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(folder_id, name)
);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files based on bucket permissions"
ON public.files FOR SELECT
TO authenticated
USING (true);

-- Create bucket_permissions table
CREATE TABLE public.bucket_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_id UUID NOT NULL REFERENCES public.storage_buckets(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  permission permission_level NOT NULL DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bucket_id, role)
);

ALTER TABLE public.bucket_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bucket permissions"
ON public.bucket_permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "PVA admin can manage bucket permissions"
ON public.bucket_permissions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'pva_admin'))
WITH CHECK (public.has_role(auth.uid(), 'pva_admin'));

-- Create audit_logs table for federal compliance
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only PVA admin and IT staff can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'pva_admin') OR
  public.has_role(auth.uid(), 'it_staff')
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_folders_updated_at
BEFORE UPDATE ON public.folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_files_updated_at
BEFORE UPDATE ON public.files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the 12 PVA storage buckets
INSERT INTO public.storage_buckets (name, display_name, description, retention_period) VALUES
  ('laurel_real_property', 'Real Property Records', 'All documents related to real property assessment and valuation', 'Permanent'),
  ('laurel_tangible_property', 'Tangible Property Records', 'Business equipment, machinery, and inventory assessment records', '10 years'),
  ('laurel_motor_vehicles', 'Motor Vehicle Records', 'Vehicle, watercraft, RV, and aircraft valuations', '7 years'),
  ('laurel_exemptions', 'Exemption Records', 'Homestead, disability, religious, educational, and agricultural exemptions', 'Permanent'),
  ('laurel_appeals', 'Appeals & BOA', 'Appeal filings, conference notes, and Board of Assessment Appeals documentation', '10 years'),
  ('laurel_maps_gis', 'Maps & GIS', 'Parcel maps, plats, GIS data, and aerial imagery', 'Permanent'),
  ('laurel_administrative', 'Administrative Records', 'Staff records, policies, procedures, and training materials', '7 years'),
  ('laurel_public_records', 'Public Records', 'Tax rolls, assessment notices, forms, and public inspection materials', 'Permanent'),
  ('laurel_legal_compliance', 'Legal & Compliance', 'KRS statutes, audits, opinions, and litigation documents', 'Permanent'),
  ('laurel_financial', 'Financial Records', 'Budget, expenses, payroll, and financial documentation', '7 years'),
  ('laurel_technology', 'Technology & Systems', 'System documentation, backups, security logs, and IT records', '7 years'),
  ('laurel_archives', 'Historical Archives', 'Historical records and archived documentation', 'Permanent');

-- Insert default bucket permissions based on role hierarchy
-- PVA Admin has admin access to all buckets
INSERT INTO public.bucket_permissions (bucket_id, role, permission)
SELECT id, 'pva_admin', 'admin'
FROM public.storage_buckets;

-- Deputy PVA has admin access to all buckets
INSERT INTO public.bucket_permissions (bucket_id, role, permission)
SELECT id, 'deputy_pva', 'admin'
FROM public.storage_buckets;

-- Senior Appraiser has write access to property-related buckets
INSERT INTO public.bucket_permissions (bucket_id, role, permission)
SELECT id, 'senior_appraiser', 'write'
FROM public.storage_buckets
WHERE name IN ('laurel_real_property', 'laurel_tangible_property', 'laurel_motor_vehicles', 'laurel_exemptions', 'laurel_appeals', 'laurel_maps_gis');

-- Appraiser has write access to specific buckets
INSERT INTO public.bucket_permissions (bucket_id, role, permission)
SELECT id, 'appraiser', 'write'
FROM public.storage_buckets
WHERE name IN ('laurel_real_property', 'laurel_motor_vehicles', 'laurel_exemptions');

-- Clerical Staff has read/write to public-facing buckets
INSERT INTO public.bucket_permissions (bucket_id, role, permission)
SELECT id, 'clerical_staff', 'write'
FROM public.storage_buckets
WHERE name IN ('laurel_public_records', 'laurel_exemptions');

-- IT Staff has admin access to technology bucket, read to others
INSERT INTO public.bucket_permissions (bucket_id, role, permission)
SELECT id, 'it_staff', 'admin'
FROM public.storage_buckets
WHERE name = 'laurel_technology';

INSERT INTO public.bucket_permissions (bucket_id, role, permission)
SELECT id, 'it_staff', 'read'
FROM public.storage_buckets
WHERE name != 'laurel_technology';

-- Board members have write access to appeals
INSERT INTO public.bucket_permissions (bucket_id, role, permission)
SELECT id, 'board_member', 'write'
FROM public.storage_buckets
WHERE name = 'laurel_appeals';

-- Taxpayers have read access to public records
INSERT INTO public.bucket_permissions (bucket_id, role, permission)
SELECT id, 'taxpayer', 'read'
FROM public.storage_buckets
WHERE name = 'laurel_public_records';

-- Public has read access to public records only
INSERT INTO public.bucket_permissions (bucket_id, role, permission)
SELECT id, 'public', 'read'
FROM public.storage_buckets
WHERE name = 'laurel_public_records';

-- Create audit log trigger function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add audit triggers to sensitive tables
CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_bucket_permissions
AFTER INSERT OR UPDATE OR DELETE ON public.bucket_permissions
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_files
AFTER INSERT OR UPDATE OR DELETE ON public.files
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
