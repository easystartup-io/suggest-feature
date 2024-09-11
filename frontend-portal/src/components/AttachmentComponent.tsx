import { File, FileAudio, FileImage, FileText, FileVideo, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

export const getFileIcon = (type) => {
  switch (type) {
    case 'pdf':
      return <FileText className="h-8 w-8" />;
    case 'image':
      return <FileImage className="h-8 w-8" />;
    case 'audio':
      return <FileAudio className="h-8 w-8" />;
    case 'video':
      return <FileVideo className="h-8 w-8" />;
    default:
      return <File className="h-8 w-8" />;
  }
};

export const handleFileClick = (url) => {
  window.open(url, '_blank');
};
export default function AttachmentComponent({ attachments, setAttachments = null, loading = false, uploading = false, allowDelete = false }) {

  const [expandedImage, setExpandedImage] = useState(null);

  const handleRemoveFile = (index) => {
    setAttachments((prevFiles) => {
      const newFiles = [...prevFiles];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  if (!attachments) {
    return null;
  }


  return <div>
    <div className="grid grid-cols-4 gap-2 mt-2">
      {attachments.length > 0 &&
        attachments.map((attachment, index) => (
          <div key={index} className="relative overflow-hidden rounded-md">
            {attachment.type === 'image' ? (
              <img
                src={attachment.url}
                alt="attachment"
                className="h-24 w-full object-cover cursor-pointer"
                onClick={() => setExpandedImage(attachment.url)}
              />
            ) :
              <Card
                className="h-24 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleFileClick(attachment.url)}
              >
                <CardContent className="flex flex-col items-center justify-center h-full p-2">
                  {getFileIcon(attachment.type)}
                  <p className="text-xs mt-2 truncate w-full text-center">
                    {attachment.name || attachment.url.split('/').pop()}
                  </p>
                </CardContent>
              </Card>
            }
            {
              allowDelete &&
              <Button
                variant="ghost"
                className="absolute top-1 right-1 p-1 h-auto bg-black bg-opacity-50 hover:bg-opacity-75 transition-opacity"
                onClick={() => handleRemoveFile(index)}
              >
                <XCircle className="h-4 w-4 text-white" />
              </Button>

            }
          </div>
        ))}
    </div>

    <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-fit h-fit p-0">
        <div className="relative w-full h-full max-w-[80vw] max-h-[80vh]">
          <img
            src={expandedImage}
            alt="Expanded view"
            className="w-full h-full object-contain"
          />
          <Button
            variant="ghost"
            className="absolute top-2 right-2 p-1 h-auto bg-black bg-opacity-50 hover:bg-opacity-75 transition-opacity"
            onClick={() => setExpandedImage(null)}
          >
            <XCircle className="h-6 w-6 text-white" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>

}
