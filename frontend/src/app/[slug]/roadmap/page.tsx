"use client"

import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Form, FormDescription, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import withAuth from '@/hoc/withAuth';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Loading from "@/components/Loading";
import { Circle, Eye, Calendar, Loader, Play, CheckCircle, XCircle, GripVertical } from "lucide-react";

const statusConfig = {
  "OPEN": {
    icon: <Circle className="w-4 h-4 inline-block mr-2 text-blue-500" />,
    label: "OPEN",
    bgColor: "bg-blue-300 dark:bg-blue-800"
  },
  "UNDER REVIEW": {
    icon: <Eye className="w-4 h-4 inline-block mr-2 text-yellow-500" />,
    label: "UNDER REVIEW",
    bgColor: "bg-yellow-300 dark:bg-yellow-800"
  },
  "PLANNED": {
    icon: <Calendar className="w-4 h-4 inline-block mr-2 text-blue-500" />,
    label: "PLANNED",
    bgColor: "bg-blue-300 dark:bg-blue-800"
  },
  "IN PROGRESS": {
    icon: <Loader className="w-4 h-4 inline-block mr-2 text-orange-500" />,
    label: "IN PROGRESS",
    bgColor: "bg-orange-300 dark:bg-orange-800"
  },
  "LIVE": {
    icon: <Play className="w-4 h-4 inline-block mr-2 text-green-500" />,
    label: "LIVE",
    bgColor: "bg-green-300 dark:bg-green-800"
  },
  "COMPLETE": {
    icon: <CheckCircle className="w-4 h-4 inline-block mr-2 text-green-500" />,
    label: "COMPLETE",
    bgColor: "bg-green-300 dark:bg-green-800"
  },
  "CLOSED": {
    icon: <XCircle className="w-4 h-4 inline-block mr-2 text-red-500" />,
    label: "CLOSED",
    bgColor: "bg-red-300 dark:bg-red-800"
  }
};

const DraggableStatus = ({ status, index, moveStatus }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "STATUS",
    item: { status, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "STATUS",
    hover(item, monitor) {
      if (!drag) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveStatus(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const { icon, label, bgColor } = statusConfig[status];

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`p-2 rounded flex items-center ${bgColor} ${isDragging ? 'opacity-50' : ''}`}
    >
      <GripVertical className="h-5 w-5 text-gray-500 cursor-move mr-2" />
      <span className="flex items-center">
        {icon}
        {label}
      </span>
    </div>
  );
};

const Dashboard = ({ params }) => {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [boards, setBoards] = useState([]);
  const [enableRoadmap, setEnableRoadmap] = useState(true);
  const [title, setTitle] = useState('');
  const [disabledBoards, setDisabledBoards] = useState([]);
  const [allowedStatuses, setAllowedStatuses] = useState([]);

  const form = useForm();
  const { reset } = form;

  useEffect(() => {
    // Fetch organization data
    fetch(`/api/auth/pages/fetch-org`, {
      headers: { "x-org-slug": params.slug }
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        if (data.roadmapSettings) {
          setDisabledBoards(data.roadmapSettings.disabledBoards || []);
          setEnableRoadmap(data.roadmapSettings.enabled);
          setTitle(data.roadmapSettings.title || '');
          setAllowedStatuses(data.roadmapSettings.allowedStatuses || []);
        } else {
          setEnableRoadmap(true);
        }
        reset(data);
      });

    // Fetch boards
    fetch(`/api/auth/boards/fetch-boards`, {
      headers: { "x-org-slug": params.slug }
    })
      .then((res) => res.json())
      .then((data) => {
        setBoards(data);
        setLoading(false);
      });
  }, [params.slug, reset]);

  const moveStatus = useCallback((dragIndex, hoverIndex) => {
    setAllowedStatuses((prevStatuses) => {
      const newStatuses = [...prevStatuses];
      const [removed] = newStatuses.splice(dragIndex, 1);
      newStatuses.splice(hoverIndex, 0, removed);
      return newStatuses;
    });
  }, []);

  const handleStatusToggle = (status) => {
    setAllowedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  async function onSubmit(formData) {
    setLoading(true);
    try {
      const reqPayload = {
        ...formData,
        roadmapSettings: {
          disabledBoards,
          enabled: enableRoadmap,
          title,
          allowedStatuses
        }
      };

      const resp = await fetch(`/api/auth/pages/edit-roadmap`, {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqPayload)
      });

      const respData = await resp.json();
      if (resp.ok) {
        setData(respData);
        toast({ title: 'Updated successfully' });
      } else {
        toast({ title: respData.message, variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Something went wrong',
        description: 'Please try again by reloading the page, if the problem persists contact support',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) return <Loading />;

  return (
    <DndProvider backend={HTML5Backend}>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 h-full">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-2xl">Roadmap - {data && data.name}</h1>
        </div>
        <div className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm">
          <div className="w-full p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="enable-roadmap">Enable Roadmap</Label>
                  <Switch
                    id="enable-roadmap"
                    disabled={isLoading}
                    checked={enableRoadmap}
                    onCheckedChange={setEnableRoadmap}
                    className="ml-4"
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel>Roadmap Title</FormLabel>
                  <Input
                    disabled={isLoading}
                    placeholder="Roadmap"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <FormDescription>
                    Select a title for your homepage.
                  </FormDescription>
                </div>
                <div className="space-y-2">
                  <FormLabel>Include boards</FormLabel>
                  {boards.map((board) => (
                    <div className="flex items-center space-x-2" key={board.id}>
                      <Checkbox
                        id={board.id}
                        onCheckedChange={(checked) => {
                          setDisabledBoards(prev =>
                            checked
                              ? prev.filter(id => id !== board.id)
                              : [...prev, board.id]
                          );
                        }}
                        checked={!disabledBoards.includes(board.id)}
                        disabled={isLoading}
                      />
                      <label htmlFor={board.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {board.name}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <FormLabel>Select Statuses for roadmap page (Recommended 3)</FormLabel>
                  {Object.entries(statusConfig).map(([status, { icon, label }]) => (
                    <div className="flex items-center space-x-2" key={status}>
                      <Checkbox
                        id={status}
                        onCheckedChange={() => handleStatusToggle(status)}
                        checked={allowedStatuses.includes(status)}
                        disabled={isLoading}
                      />
                      <label htmlFor={status} className="flex items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {icon}
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <FormLabel>Reorder Selected Statuses</FormLabel>
                  <div className="space-y-2">
                    {allowedStatuses.map((status, index) => (
                      <DraggableStatus
                        key={status}
                        status={status}
                        index={index}
                        moveStatus={moveStatus}
                      />
                    ))}
                  </div>
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </main>
    </DndProvider>
  );
};

export default withAuth(Dashboard);
