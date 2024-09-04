import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from './icons';
import { cn } from '@/lib/utils';

export default function FileUploadButton({ uploading, setUploading, uploadedFileUrl, setUploadedFileUrl }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    handleUpload(event.target.files[0]);
  };

  const handleUpload = async (selectedFile) => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`/api/auth/upload/upload-file`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setUploadedFileUrl(data.url);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center justify-center space-y-4">
      {uploading &&
        <Button
          disabled={true}
          variant="ghost"
        >
          <Icons.spinner className="animate-spin mr-2 " />
          Uploading...
        </Button>
      }
      <Input
        className={cn(!uploading ? '' : 'hidden')}
        type="file"
        onChange={handleFileChange}
      />
    </div>
  );
}

