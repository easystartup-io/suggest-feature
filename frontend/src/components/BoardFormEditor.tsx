import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Paperclip } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Icons } from './icons';

const BoardFormEditor = ({ params, data }) => {
  const [heading, setHeading] = useState('Create Post');
  const [description, setDescription] = useState('Add a new post to the board');
  const [titleLabel, setTitleLabel] = useState('Title');
  const [titlePlaceholder, setTitlePlaceholder] = useState('Enter a title');
  const [descriptionLabel, setDescriptionLabel] = useState('Description');
  const [descriptionPlaceholder, setDescriptionPlaceholder] = useState('Enter a description');
  const [buttonText, setButtonText] = useState('Submit');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data && data.boardForm) {
      setHeading(data.boardForm.heading);
      setDescription(data.boardForm.description);
      setTitleLabel(data.boardForm.titleLabel);
      setTitlePlaceholder(data.boardForm.titlePlaceholder);
      setDescriptionLabel(data.boardForm.descriptionLabel);
      setDescriptionPlaceholder(data.boardForm.descriptionPlaceholder);
      setButtonText(data.boardForm.buttonText);
    }
  }, [data]);

  const handleSave = async () => {
    console.log({
      heading,
      description,
      titleLabel,
      titlePlaceholder,
      descriptionLabel,
      descriptionPlaceholder,
      buttonText
    });
    setLoading(true)
    try {

      const response = await fetch(`/api/auth/boards/update-board-form?boardSlug=${params.id}`, {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          heading,
          description,
          titleLabel,
          titlePlaceholder,
          descriptionLabel,
          descriptionPlaceholder,
          buttonText
        })
      })

      const respData = await response.json();
      if (response.ok) {
        toast({
          title: `Post form updated`,
        })
      } else {
        toast({
          title: `Error updating post form`,
          description: respData.message,
          variant: 'destructive'
        })
      }
    } catch (err) {
      toast({
        title: err.message,
        variant: 'destructive'
      })
    }

    setTimeout(() => {
      setLoading(false);
    }, 1000)
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <Card className="w-full lg:w-2/3">
        <CardHeader>
          <CardTitle>Board Form Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="heading">Heading</Label>
            <Input
              id="heading"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="titleLabel">Title Label</Label>
            <Input
              id="titleLabel"
              value={titleLabel}
              onChange={(e) => setTitleLabel(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="titlePlaceholder">Title Placeholder</Label>
            <Input
              id="titlePlaceholder"
              value={titlePlaceholder}
              onChange={(e) => setTitlePlaceholder(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="descriptionLabel">Description Label</Label>
            <Input
              id="descriptionLabel"
              value={descriptionLabel}
              onChange={(e) => setDescriptionLabel(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="descriptionPlaceholder">Description Placeholder</Label>
            <Input
              id="descriptionPlaceholder"
              value={descriptionPlaceholder}
              onChange={(e) => setDescriptionPlaceholder(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="buttonText">Button Text</Label>
            <Input
              id="buttonText"
              value={buttonText}
              placeholder="Submit"
              onChange={(e) => setButtonText(e.target.value)}
            />
          </div>
          <Button
            disabled={loading}
            onClick={handleSave} className="w-full">
            {loading &&
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            }
            Save Form Settings
          </Button>
        </CardContent>
      </Card>

      <div
        className="w-full lg:w-1/3"
      >
        <div
          className="text-2xl font-semibold leading-none tracking-tight my-4"
        >
          Create post preview
        </div>
        <Card
          className="pt-8"
        >
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{heading}</h2>
              <p className="text-gray-600">{description}</p>
            </div>
            <div>
              <Label htmlFor="previewTitle">{titleLabel}</Label>
              <Input id="previewTitle" placeholder={titlePlaceholder} />
            </div>
            <div>
              <Label htmlFor="previewDescription">{descriptionLabel}</Label>
              <Textarea id="previewDescription" placeholder={descriptionPlaceholder} className="min-h-[100px]" />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="icon">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button variant="default">
                {buttonText || 'Submit'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BoardFormEditor;
