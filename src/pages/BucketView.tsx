import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, getUserRole, type PermissionLevel } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Download, Eye, File, FileText, Image, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FileItem {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  metadata: {
    size?: number;
    mimetype?: string;
  };
}

interface Bucket {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
}

const BucketView = () => {
  const navigate = useNavigate();
  const { bucketName } = useParams<{ bucketName: string }>();
  const [bucket, setBucket] = useState<Bucket | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [permission, setPermission] = useState<PermissionLevel>('none');
  const [currentPath] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      // Fetch bucket info
      if (!bucketName) {
        navigate("/dashboard");
        return;
      }
      const { data: bucketData, error: bucketError } = await supabase
        .from('storage_buckets')
        .select('*')
        .eq('name', bucketName)
        .single();

      if (bucketError || !bucketData) {
        toast.error("Bucket not found");
        navigate("/dashboard");
        return;
      }
      const bucketInfo = bucketData as Bucket;
      setBucket(bucketInfo);

      // Get user role and permissions
      const { data: roleData } = await getUserRole(session.user.id);
      if (roleData) {
        const { data: permData } = await supabase
          .from('bucket_permissions')
          .select('permission')
          .eq('bucket_id', bucketInfo.id)
          .eq('role', roleData)
          .single() as { data: { permission: PermissionLevel } | null };

        if (permData && permData.permission) {
          setPermission(permData.permission);
        }
      }

      // Fetch files from storage
      await fetchFiles(bucketName || "");
      setLoading(false);
    };

    init();
  }, [bucketName, navigate]);

  const fetchFiles = async (bucket: string, path: string = "") => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error("Error fetching files:", error);
        toast.error("Failed to load files");
        return;
      }

      setFiles(data || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !bucketName) return;
    
    const file = event.target.files[0];
    setUploading(true);

    try {
      const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      toast.success("File uploaded successfully");
      await fetchFiles(bucketName, currentPath);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileName: string) => {
    if (!bucketName) return;

    try {
      const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error.message || "Failed to download file");
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!bucketName || permission !== 'admin' && permission !== 'write') {
      toast.error("You don't have permission to delete files");
      return;
    }

    try {
      const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) throw error;

      toast.success("File deleted successfully");
      await fetchFiles(bucketName, currentPath);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete file");
    }
  };

  const handlePreview = async (fileName: string) => {
    if (!bucketName) return;

    try {
      const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      window.open(data.publicUrl, '_blank');
    } catch (error: any) {
      toast.error(error.message || "Failed to preview file");
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="h-4 w-4" />;
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const permissionColors: Record<string, string> = {
    'admin': 'bg-primary text-primary-foreground',
    'write': 'bg-green-500 text-white',
    'read': 'bg-blue-500 text-white',
    'none': 'bg-muted text-muted-foreground',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const canUpload = permission === 'admin' || permission === 'write';
  const canDelete = permission === 'admin' || permission === 'write';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{bucket?.display_name}</h1>
                <p className="text-sm text-muted-foreground">{bucket?.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={permissionColors[permission]}>
                {permission} access
              </Badge>
              {canUpload && (
                <div className="relative">
                  <Input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Button disabled={uploading}>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload File"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
            <CardDescription>
              {files.length} file{files.length !== 1 ? 's' : ''} in this bucket
            </CardDescription>
          </CardHeader>
          <CardContent>
            {permission === 'none' ? (
              <div className="text-center py-8 text-muted-foreground">
                You don't have permission to view files in this bucket.
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No files in this bucket yet.
                {canUpload && " Upload a file to get started."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Modified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id || file.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.name)}
                          {file.name}
                        </div>
                      </TableCell>
                      <TableCell>{formatFileSize(file.metadata?.size)}</TableCell>
                      <TableCell>
                        {file.updated_at ? new Date(file.updated_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(file.name)}
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(file.name)}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(file.name)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Laurel County Property Valuation Administrator</p>
            <p>101 S. Main St. Room 127, London, KY 40741</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BucketView;
