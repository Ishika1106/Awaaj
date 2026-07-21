'use client';
import { extractCoords } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import {
  CircleX,
  Nfc,
  CalendarDays,
  FileUser,
  PersonStanding,
  MapPin,
  TrendingUp,
  Loader2,
  Check,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Post {
  _id: string;
  Name: string;
  Location: string;
  location_name?: string;
  'Preferred way of contact': string;
  'Contact info': string;
  'Frequency of domestic violence': string;
  'Relationship with perpetrator': string;
  'Severity of domestic violence': string;
  'Nature of domestic violence': string;
  'Impact on children': string;
  'Culprit details': string;
  'Other info': string;
  status: string;
  latitude?: number;
  longitude?: number;
}

function PostDetail({ id }: { id: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPostById = async () => {
      try {
        const response = await fetch(`/api/postbyid/${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }

        const data = await response.json();
        setPost(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        );
      }
    };

    fetchPostById();
  }, [id]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!post) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }
  const coords = extractCoords(post);
  const lat = coords?.lat;
  const lng = coords?.lng;
  const showMap = lat && lng && !isNaN(lat) && !isNaN(lng);
  const mapUrl = showMap
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`
    : '';

  const handleCloseIssue = async (issueId: string) => {
    try {
      const response = await fetch('/api/close-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ issueId }),
      });

      if (!response.ok) {
        throw new Error('Failed to close issue');
      }

      toast.success('Issue closed successfully');
      setPost((prevPost) =>
        prevPost ? { ...prevPost, status: 'closed' } : null
      );
    } catch (error) {
      console.error(error);
      toast.error('Failed to close issue');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this report?')) return;
    try {
      const res = await fetch('/api/delete-post', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post._id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Report deleted');
      router.push('/dashboard');
    } catch {
      toast.error('Failed to delete report');
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-orange-50/50 to-white">
      <div className="flex flex-col h-full max-w-6xl w-full mx-auto p-5">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-3xl font-bold text-gray-900">{post.Name}</h1>
          <div className="flex items-center gap-2">
            {post.status === 'pending' && (
              <Button
                onClick={() => handleCloseIssue(post._id)}
                className="flex items-center space-x-2"
              >
                <CircleX />
                Close Issue
              </Button>
            )}
            {post.status === 'closed' && (
              <Button className="flex items-center space-x-2 bg-green-600 text-white hover:bg-green-700">
                <Check />
                Issue Closed
              </Button>
            )}
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="flex items-center space-x-2"
            >
              <Trash2 />
              Delete
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="max-w-sm w-full rounded-md border border-gray-200 flex flex-col gap-3 p-3">
            <div className="flex items-center justify-between w-full gap-5">
              <h2 className="text-lg font-semibold text-gray-900">Preferred way of contact</h2>
              <Nfc className="text-orange-600" />
            </div>
            <p className="text-gray-600">{post['Preferred way of contact']}</p>
            <p className="text-gray-600">{post['Contact info']}</p>
          </div>
          <div className="max-w-sm w-full rounded-md border border-gray-200 flex flex-col gap-3 p-3">
            <div className="flex items-center justify-between w-full gap-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Frequency of domestic violence
              </h2>
              <CalendarDays className="text-orange-600" />
            </div>
            <p className="text-gray-600">{post['Frequency of domestic violence']}</p>
            <p className="text-gray-600">{post['Relationship with perpetrator']}</p>
          </div>
          <div className="max-w-sm w-full rounded-md border border-gray-200 flex flex-col gap-3 p-3">
            <div className="flex items-center justify-between w-full gap-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Nature of domestic violence
              </h2>
              <PersonStanding className="text-orange-600" />
            </div>
            <p className="text-gray-600">{post['Impact on children']}</p>
            <p className="text-gray-600">{post['Severity of domestic violence']}</p>
          </div>
          <div className="max-w-sm w-full rounded-md border border-gray-200 flex flex-col gap-3 p-3">
            <div className="flex items-center justify-between w-full gap-5">
              <h2 className="text-lg font-semibold text-gray-900">Culprit details</h2>
              <FileUser className="text-orange-600" />
            </div>
            <p className="text-gray-600">{post['Culprit details']}</p>
            <p className="text-gray-600">{post['Other info']}</p>
          </div>
          <div className="max-w-sm w-full rounded-md border border-gray-200 flex flex-col gap-3 p-3">
            <div className="flex items-center justify-between w-full gap-5">
              <h2 className="text-lg font-semibold text-gray-900">Location</h2>
              <MapPin className="text-orange-600" />
            </div>
            <p className="text-gray-600">{post.location_name || post.Location || 'Unknown'}</p>
          </div>
          <div className="max-w-sm w-full rounded-md border border-gray-200 flex flex-col gap-3 p-3">
            <div className="flex items-center justify-between w-full gap-5">
              <h2 className="text-lg font-semibold text-gray-900">Current Status</h2>
              <TrendingUp className="text-orange-600" />
            </div>
            <p className="text-gray-600">{post.status}</p>
            <p className="text-gray-600">
              Resolve this issue by contacting the person and providing necessary
            </p>
          </div>
        </div>
        {showMap && (
          <div className="flex items-center w-full mt-5">
            <div className="rounded-md w-full p-1 border border-gray-200">
              <iframe
                width="100%"
                height="360"
                className="rounded-md border border-gray-200"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={mapUrl}
              ></iframe>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostDetail;
