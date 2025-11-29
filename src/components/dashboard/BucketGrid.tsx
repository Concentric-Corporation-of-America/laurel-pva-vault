import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, getUserRole, type UserRole, type PermissionLevel } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen,
  Home,
  Building,
  Car,
  Shield,
  FileText,
  Map,
  Users,
  BookOpen,
  Scale,
  DollarSign,
  Server,
  Archive
} from "lucide-react";

interface Bucket {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  retention_period: string | null;
}

interface BucketGridProps {
  userId: string;
  searchQuery: string;
}

const bucketIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'laurel_real_property': Home,
  'laurel_tangible_property': Building,
  'laurel_motor_vehicles': Car,
  'laurel_exemptions': Shield,
  'laurel_appeals': FileText,
  'laurel_maps_gis': Map,
  'laurel_administrative': Users,
  'laurel_public_records': BookOpen,
  'laurel_legal_compliance': Scale,
  'laurel_financial': DollarSign,
  'laurel_technology': Server,
  'laurel_archives': Archive,
};

const permissionColors: Record<string, string> = {
  'admin': 'bg-primary text-primary-foreground',
  'write': 'bg-green-500 text-white',
  'read': 'bg-blue-500 text-white',
  'none': 'bg-muted text-muted-foreground',
};

const BucketGrid = ({ userId, searchQuery }: BucketGridProps) => {
  const navigate = useNavigate();
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [permissions, setPermissions] = useState<Record<string, PermissionLevel>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user role using helper function
        const { data: roleData, error: roleError } = await getUserRole(userId);
        
        if (roleError) {
          console.error("Error fetching user role:", roleError);
        }

        // Fetch buckets
        const { data: bucketsData, error: bucketsError } = await supabase
          .from('storage_buckets')
          .select('*')
          .order('display_name');
        
        if (bucketsError) {
          console.error("Error fetching buckets:", bucketsError);
        } else {
          setBuckets(bucketsData || []);
        }

        // Fetch permissions for user's role
        if (roleData) {
          const { data: permData, error: permError } = await supabase
            .from('bucket_permissions')
            .select('bucket_id, permission')
            .eq('role', roleData as UserRole);
          
          if (permError) {
            console.error("Error fetching permissions:", permError);
          } else if (permData) {
            const permMap: Record<string, PermissionLevel> = {};
            permData.forEach((p: { bucket_id: string; permission: PermissionLevel }) => {
              permMap[p.bucket_id] = p.permission;
            });
            setPermissions(permMap);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const filteredBuckets = buckets.filter(bucket =>
    bucket.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bucket.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredBuckets.map((bucket) => {
        const IconComponent = bucketIcons[bucket.name] || FolderOpen;
        const permission = permissions[bucket.id] || 'none';
        
        return (
          <Card 
            key={bucket.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary"
            onClick={() => navigate(`/bucket/${bucket.name}`)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconComponent className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{bucket.display_name}</CardTitle>
                </div>
                <Badge className={permissionColors[permission]}>
                  {permission}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-2">
                {bucket.description}
              </CardDescription>
              <div className="text-xs text-muted-foreground">
                Retention: {bucket.retention_period}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default BucketGrid;
