"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import FileUploadButton from '@/components/FileButton';
import { Icons } from '@/components/icons';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const EditorJS = dynamic(() => import('@editorjs/editorjs'), { ssr: false });

const ChangelogEditor = ({ params }) => {
  const { toast } = useToast();
  const editorRef = useRef(null);
  const [changelogData, setChangelogData] = useState({
    title: '',
    content: null,
    coverImage: null,
    tags: [],
  });
  const [isDraft, setIsDraft] = useState(true);
  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    fetchChangelogData();
  }, [params.id, params.slug]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initEditor();
    }
  }, []);

  const initEditor = async () => {
    const EditorJS = (await import('@editorjs/editorjs')).default;
    const Header = (await import('@editorjs/header')).default;
    const List = (await import('@editorjs/list')).default;
    const Embed = (await import('@editorjs/embed')).default;
    const Image = (await import('@editorjs/image')).default;
    const Code = (await import('@editorjs/code')).default;

    if (!editorRef.current) {
      const editor = new EditorJS({
        holder: 'editorjs',
        tools: {
          header: Header,
          list: List,
          embed: Embed,
          image: {
            class: Image,
            config: {
              uploader: {
                uploadByFile(file) {
                  // Implement your file upload logic here
                  return Promise.resolve({
                    success: 1,
                    file: {
                      url: 'https://example.com/image.png',
                    }
                  });
                }
              }
            }
          },
          code: Code,
        },
        data: changelogData.content,
        onChange: async () => {
          const content = await editor.save();
          setChangelogData(prev => ({ ...prev, content }));
        },
      });

      editorRef.current = editor;
    }
  };

  const fetchChangelogData = async () => {
    try {
      const response = await fetch(`/api/auth/changelog/fetch-changelog?changelogId=${params.id}`, {
        headers: {
          "x-org-slug": params.slug
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch changelog data');
      }
      const data = await response.json();
      data.tags = data.tags || [];
      data.content = JSON.parse(data.content || '{}');
      setChangelogData(data);
      setIsDraft(data.draft);

      if (typeof window !== 'undefined' && !editorRef.current) {
        initEditor();
      }
      if (editorRef.current) {
        console.log(data.content)
        editorRef.current.render(data.content);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch changelog data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setChangelogData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (url) => {
    setChangelogData(prev => ({ ...prev, coverImage: url }));
  };

  const handleAddTag = () => {
    if (newTag && !changelogData.tags.includes(newTag)) {
      setChangelogData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      setNewTag('');
      toast({
        title: "Tag Added",
        description: `"${newTag}" has been added to the changelog.`,
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && newTag) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setChangelogData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
    toast({
      title: "Tag Removed",
      description: `"${tagToRemove}" has been removed from the changelog.`,
    });
  };

  const handleSave = async (saveAsDraft = true) => {
    const content = await editorRef.current.save();
    const payload = {
      changelogId: params.id,
      title: changelogData.title,
      content: JSON.stringify(content),
      tags: changelogData.tags || [],
      draft: saveAsDraft,
      coverImage: changelogData.coverImage
    };

    try {
      const response = await fetch('/api/auth/changelog/update-changelog-details', {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('Failed to save changelog');
      }
      setIsDraft(saveAsDraft);
      toast({
        title: saveAsDraft ? "Draft Saved" : "Changelog Published",
        description: saveAsDraft ? "Your changelog has been saved as a draft." : "Your changelog has been published successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changelog. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this changelog?')) {
      try {
        const response = await fetch('/api/auth/changelog/delete-changelog', {
          method: 'POST',
          headers: {
            "x-org-slug": params.slug,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ changelogId: params.id })
        });
        if (!response.ok) {
          throw new Error('Failed to delete changelog');
        }
        toast({
          title: "Changelog Deleted",
          description: "The changelog has been successfully deleted.",
        });
        router.push(`/${params.slug}/changelog`);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete changelog. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="w-full mx-auto mt-4 border-0 px-4">
      {/* <CardHeader> */}
      {/*   <CardTitle>Changelog Editor</CardTitle> */}
      {/* </CardHeader> */}
      <CardContent>
        <div className="flex justify-end space-x-2">
          {isDraft ? (
            <>
              <Button variant="outline" onClick={() => handleSave(true)}>
                Save as Draft
              </Button>
              <Button onClick={() => handleSave(false)}>
                Publish
              </Button>
            </>
          ) : (
            <Button onClick={() => handleSave(false)}>
              Publish Changes
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
        <div className="space-y-6">
          <Input
            type="text"
            name="title"
            placeholder="Enter title"
            value={changelogData.title}
            onChange={handleInputChange}
            className="font-bold text-2xl border-0 focus:ring-0 focus-visible:ring-0 px-0 mx-0 my-0 py-0 ring-offset-0 focus-visible:ring-offset-0"
          />

          <div className='flex items-start justify-between space-x-4'>
            <div className='flex items-center space-x-4 cursor-pointer'
              onClick={() => fileInputRef?.current?.click()}
            >
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden h-64">
                {changelogData.coverImage ? (
                  <img
                    src={changelogData.coverImage}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    {uploading ? <Icons.spinner className="h-6 w-6 animate-spin" /> : 'Cover image'}
                  </div>
                )}
              </div>
              <FileUploadButton
                innerRef={fileInputRef}
                className="hidden"
                uploading={uploading}
                setUploading={setUploading}
                uploadedFileUrl={changelogData.coverImage || ''}
                setUploadedFileUrl={handleImageChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {changelogData.tags && changelogData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X size={14} onClick={() => handleRemoveTag(tag)} className="cursor-pointer" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add a tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button onClick={handleAddTag}>Add Tag</Button>
              </div>
            </div>
          </div>

          {/* https://github.com/codex-team/editor.js/discussions/1910 */}
          <div className="prose">
            <div id="editorjs" className="rounded-md w-full whateverNameYouWantHere editor-container" />
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

export default ChangelogEditor;
