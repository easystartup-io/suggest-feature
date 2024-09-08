import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

export default function FileUploadButton({ uploading, setUploading, uploadedFileUrl, setUploadedFileUrl }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const { verifyLoginOrPrompt } = useAuth();

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    handleUpload(event.target.files[0]);
  };

  const handleUpload = async (selectedFile) => {
    if (!selectedFile) return;


    if (verifyLoginOrPrompt()) {
      return;
    }

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
    <div className="flex flex-col items-center space-y-4">
      <Input
        type="file"
        onChange={handleFileChange}
      // className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
      />
    </div>
  );
}

