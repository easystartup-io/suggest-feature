"use client"

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Users } from "lucide-react";

const fetchNotifications = async (filters, params) => {
  try {
    const resp = await fetch(`/api/auth/notification/get`, {
      method: "POST",
      headers: {
        "x-org-slug": params.slug,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        boardId: filters.boardId === 'all' ? undefined : filters.boardId,
        createdByUserType: filters.userType === 'all' ? undefined : filters.userType,
        notificationType: filters.type === 'all' ? undefined : filters.type,
      })
    });

    if (resp.ok) {
      return await resp.json();
    } else {
      throw new Error('Failed to fetch notifications');
    }
  } catch (e) {
    console.error("Error fetching notifications:", e);
    throw e;
  }
};

const formatBadgeText = (text) => {
  return text.replace(/_/g, ' ');
};

const UserBadge = ({ user }) => (
  <Badge variant="outline" className={`ml-2 ${user.partOfOrg ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
    {user.partOfOrg ? <Users className="w-3 h-3 mr-1 inline" /> : <User className="w-3 h-3 mr-1 inline" />}
    {user.partOfOrg ? 'Team Member' : 'User'}
  </Badge>
);

const NotificationItem = ({ notification }) => {
  const getNotificationContent = () => {
    const { type, data } = notification;
    const actionUser = data.comment ? data.comment.user : data.post.user;

    switch (type) {
      case 'POST':
        return (
          <>
            New post: <strong>"{data.post.title}"</strong> by {actionUser.name}
          </>
        );
      case 'COMMENT':
        if (data.comment.replyToCommentId) {
          return (
            <>
              New reply on <strong>"{data.post.title}"</strong> by {actionUser.name}: "{data.comment.content}"
            </>
          );
        } else {
          return (
            <>
              New comment on <strong>"{data.post.title}"</strong> by {actionUser.name}: "{data.comment.content}"
            </>
          );
        }
      case 'POST_STATUS_UPDATE':
        return (
          <>
            Status update for <strong>"{data.post.title}"</strong>: {data.post.status} (by {actionUser.name})
          </>
        );
      case 'UPVOTE':
        return (
          <>
            <strong>"{data.post.title}"</strong> was upvoted by {actionUser.name}
          </>
        );
      case 'FOLLOW':
        return (
          <>
            <strong>"{data.post.title}"</strong> is now followed by {actionUser.name}
          </>
        );
      case 'MENTION':
        return (
          <>
            You were mentioned in <strong>"{data.post.title}"</strong> by {actionUser.name}: "{data.comment.content}"
          </>
        );
      default:
        return (
          <>
            Notification related to <strong>"{data.post.title}"</strong>
          </>
        );
    }
  };

  const getBadgeColor = () => {
    switch (notification.type) {
      case 'POST':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'COMMENT':
        return notification.data.comment.replyToCommentId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600';
      case 'POST_STATUS_UPDATE':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'UPVOTE':
        return 'bg-red-500 hover:bg-red-600';
      case 'FOLLOW':
        return 'bg-indigo-500 hover:bg-indigo-600';
      case 'MENTION':
        return 'bg-pink-500 hover:bg-pink-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const actionUser = notification.data.comment ? notification.data.comment.user : notification.data.post.user;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center flex-wrap">
          <Badge className={`${getBadgeColor()} text-white`}>
            {formatBadgeText(notification.type)}
          </Badge>
          <UserBadge user={actionUser} />
          <span className="ml-auto text-gray-500">{new Date(notification.createdAt).toLocaleString()}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{getNotificationContent()}</p>
      </CardContent>
    </Card>
  );
};

const NotificationsPage = ({ params }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    search: '',
    userType: 'all',
    boardId: 'all'
  });

  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedNotifications = await fetchNotifications(filters, params);
        setNotifications(fetchedNotifications);
      } catch (e) {
        setError("Failed to load notifications. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    loadNotifications();
  }, [filters, params]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filters.type !== 'all' && notification.type !== filters.type) return false;
    if (filters.search && !JSON.stringify(notification).toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>

      <div className="flex flex-wrap gap-4 mb-4">
        <Select onValueChange={(value) => handleFilterChange('type', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="POST">Posts</SelectItem>
            <SelectItem value="COMMENT">Comments</SelectItem>
            {/* <SelectItem value="REPLY">Replies</SelectItem> */}
            <SelectItem value="POST_STATUS_UPDATE">Status Updates</SelectItem>
            {/* <SelectItem value="UPVOTE">Upvotes</SelectItem> */}
            {/* <SelectItem value="FOLLOW">Follows</SelectItem> */}
            {/* <SelectItem value="MENTION">Mentions</SelectItem> */}
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => handleFilterChange('userType', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by user" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="TEAM_MEMBER">Team Members</SelectItem>
            <SelectItem value="END_USER">Customers</SelectItem>
          </SelectContent>
        </Select>

        {/* <Input */}
        {/*   type="text" */}
        {/*   placeholder="Search notifications..." */}
        {/*   className="w-full md:w-auto" */}
        {/*   onChange={(e) => handleFilterChange('search', e.target.value)} */}
        {/* /> */}
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {!isLoading && !error && (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            {/* <TabsTrigger value="replies">Replies</TabsTrigger> */}
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            {filteredNotifications.map(notification => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </TabsContent>
          <TabsContent value="posts">
            {filteredNotifications.filter(n => n.type === 'POST').map(notification => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </TabsContent>
          <TabsContent value="comments">
            {filteredNotifications.filter(n => n.type === 'COMMENT').map(notification => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </TabsContent>
          <TabsContent value="replies">
            {filteredNotifications.filter(n => n.type === 'REPLY').map(notification => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </TabsContent>
          <TabsContent value="other">
            {filteredNotifications.filter(n => !['POST', 'COMMENT', 'REPLY'].includes(n.type)).map(notification => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </TabsContent>
        </Tabs>
      )}

      {!isLoading && !error && filteredNotifications.length === 0 && (
        <div className="text-center text-gray-500 mt-8">No notifications found.</div>
      )}
    </div>
  );
};

export default NotificationsPage;
