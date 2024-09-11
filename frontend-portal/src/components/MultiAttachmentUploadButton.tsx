import { useAuth } from "@/context/AuthContext";
import { Paperclip } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function MultiAttachmentUploadButton({ attachments, setAttachments, loading, uploading, setUploading }) {

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 5MB
  const fileInputRef = useRef(null);
  const { verifyLoginOrPrompt } = useAuth();
  const { toast } = useToast();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    if (verifyLoginOrPrompt()) {
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File is too large',
        description: 'Please upload a file that is less than 10MB in size',
        variant: 'destructive'
      })
      return
    }

    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/auth/upload/upload-file`, {
        method: 'POST',
        body: formData,
      });


      const respData = await response.json();

      if (!response.ok) {
        toast({
          title: respData.message,
          variant: 'destructive'
        })
        throw new Error('Upload failed');
      }

      setAttachments([
        ...attachments,
        {
          "type": respData.type,
          "url": respData.url,
          "name": respData.name,
          "contentType": respData.contentType,
        }
      ]);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }

  }

  const handleButtonClick = () => {

    if (verifyLoginOrPrompt()) {
      return;
    }

    if (loading || uploading) return;
    if (attachments.length >= 50) {
      toast({
        title: 'Too many attachments',
        variant: 'destructive'
      })
      return;
    }
    fileInputRef.current.click();
  };

  return <Button variant="outline" size="icon"
    onClick={handleButtonClick}
    disabled={uploading || loading}
  >
    <Paperclip className='h-4 w-4 text-gray-500' />
    <input
      ref={fileInputRef}
      type="file"
      className="hidden"
      onChange={handleFileChange}
    />
  </Button>
}
