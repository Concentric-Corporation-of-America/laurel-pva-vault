import { useEffect, useState } from "react";
import { getUserRole, type UserRole } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Crown, UserCog, Briefcase, Hammer, FileText, Code, Gavel, User, Globe } from "lucide-react";

interface UserRoleBadgeProps {
  userId: string;
}

const roleConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  'pva_admin': { label: 'PVA Administrator', icon: Crown, variant: 'default' },
  'deputy_pva': { label: 'Deputy PVA', icon: UserCog, variant: 'default' },
  'senior_appraiser': { label: 'Senior Appraiser', icon: Briefcase, variant: 'secondary' },
  'appraiser': { label: 'Appraiser', icon: Hammer, variant: 'secondary' },
  'clerical_staff': { label: 'Clerical Staff', icon: FileText, variant: 'secondary' },
  'it_staff': { label: 'IT Staff', icon: Code, variant: 'secondary' },
  'board_member': { label: 'Board Member', icon: Gavel, variant: 'outline' },
  'taxpayer': { label: 'Taxpayer', icon: User, variant: 'outline' },
  'public': { label: 'Public', icon: Globe, variant: 'outline' },
};

const UserRoleBadge = ({ userId }: UserRoleBadgeProps) => {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data, error } = await getUserRole(userId);
        
        if (error) {
          console.error("Error fetching user role:", error);
          return;
        }
        
        setRole(data);
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, [userId]);

  if (!role) {
    return (
      <Badge variant="outline" className="animate-pulse">
        Loading...
      </Badge>
    );
  }

  const config = roleConfig[role] || roleConfig['public'];
  const IconComponent = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <IconComponent className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export default UserRoleBadge;
