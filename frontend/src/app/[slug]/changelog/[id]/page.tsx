"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import FileUploadButton from '@/components/FileButton';

const ChangelogEditor = ({ params }) => {
  const { toast } = useToast();
  const [changelogData, setChangelogData] = useState({
    title: '',
    content: '',
    coverImage: null,
    tags: [],
  });
  const [isDraft, setIsDraft] = useState(true);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetchChangelogData();
  }, [params.id, params.slug]);

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
      setChangelogData(data);
      setIsDraft(data.draft); // Assuming the API returns a 'draft' field
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
    const payload = {
      changelogId: params.id,
      title: changelogData.title,
      content: changelogData.content,
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
          method: 'DELETE',
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
        // Redirect or handle deletion success
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
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>Changelog Editor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            type="text"
            name="title"
            placeholder="Enter title"
            value={changelogData.title}
            onChange={handleInputChange}
            className="font-bold text-xl"
          />
          <div>
            <label htmlFor="cover-image" className="block text-sm font-medium text-gray-700">
              Cover Image
            </label>
            <FileUploadButton
              uploading={false}
              setUploading={() => { }}
              uploadedFileUrl={changelogData.coverImage || ''}
              setUploadedFileUrl={handleImageChange}
            />
          </div>
          <Textarea
            name="content"
            placeholder="Enter changelog content (Markdown supported)"
            value={changelogData.content}
            onChange={handleInputChange}
            rows={10}
            className="font-mono"
          />
          <div>
            <Input
              type="text"
              placeholder="Add a tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="mb-2"
            />
            <Button onClick={handleAddTag} className="mb-2">Add Tag</Button>
            <div className="flex flex-wrap gap-2">
              {changelogData.tags && changelogData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X size={14} onClick={() => handleRemoveTag(tag)} className="cursor-pointer" />
                </Badge>
              ))}
            </div>
          </div>
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
        </div>
      </CardContent>
    </Card>
  );
};

export default ChangelogEditor;
