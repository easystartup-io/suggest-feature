import React, { useRef, useState, useCallback, useEffect } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";

export default function MultiAttachmentUploadButton({ attachments, setAttachments, loading = false, uploading, setUploading }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File is too large',
        description: 'Please upload a file that is less than 10MB in size',
        variant: 'destructive'
      });
      return;
    }
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
        });
        throw new Error('Upload failed');
      }
      setAttachments(prevAttachments => [
        ...prevAttachments,
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
  };

  const handleFileChange = (e) => {
    for (let i = 0; i < e.target.files.length; i++) {
      handleFile(e.target.files[i])
    }
  };

  const handleButtonClick = () => {
    if (loading || uploading) return;
    if (attachments && attachments.length >= 50) {
      toast({
        title: 'Too many attachments',
        variant: 'destructive'
      });
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={handleButtonClick}
        disabled={uploading || loading}
      >
        {(uploading || loading) ? (
          <Icons.spinner className={cn("h-4 w-4 animate-spin")} />
        ) : (
          <Paperclip className='h-4 w-4 text-gray-500' />
        )}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple={true}
        onChange={handleFileChange}
      />
    </>
  );
}
