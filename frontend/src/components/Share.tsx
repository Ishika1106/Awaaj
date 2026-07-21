'use client';

import React from 'react';
import { Button } from './ui/button';
import { Download, Copy, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ShareProps {
  imageURL: string;
  resText: string;
  setShared: (shared: boolean) => void;
  coordinates?: { lat: number; lng: number } | null;
}

function generateSubmissionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().split('-')[0].toUpperCase();
  }
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

function extractCoordinates(text: string): { lat: number; lng: number } | null {
  const patterns = [
    /lat[:\s]*([\d.-]+)[,\s]+l(?:on|ng)[:\s]*([\d.-]+)/i,
    /([\d.-]+\.\d+)[,\s]+([\d.-]+\.\d+)/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90) return { lat, lng };
    }
  }
  return null;
}

function Share({ imageURL, resText, setShared, coordinates }: ShareProps) {
  const [encodedImageURL, setEncodedImageURL] = React.useState<string>('');
  const [saving, setSaving] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [submissionId] = React.useState(generateSubmissionId);

  const hashtag = `#Awaaj${submissionId}`;

  const saveAndEncode = async () => {
    if (saving || done) return;
    setSaving(true);
    try {
      const encodeRes = await axios.post('/api/encode', {
        imageURL,
        text: resText,
      });
      setEncodedImageURL(encodeRes.data.encodedImageURL);

      setDone(true);
      toast.success('Your message is hidden in the image!');

      try {
        const decomposeRes = await axios.post('/api/classify-text', {
          text: resText,
        });

        const coords = coordinates || extractCoordinates(resText);

        const dataToSave = {
          ...decomposeRes.data.decomposed,
          submission_id: submissionId,
          hashtag,
          status: 'pending',
          ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
        };
        await axios.post('/api/save-post', dataToSave);
      } catch (saveError) {
        console.error('Failed to save post (non-critical):', saveError);
      }
    } catch (error) {
      console.error('Error encoding image:', error);
      toast.error('Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    const url = encodedImageURL || imageURL;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `awaaj-${submissionId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      const link = document.createElement('a');
      link.href = url;
      link.download = `awaaj-${submissionId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopyHashtag = () => {
    navigator.clipboard.writeText(hashtag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-4 max-w-lg mx-auto">
      <div className="relative w-full aspect-square">
        <Image
          src={encodedImageURL || imageURL}
          alt="Your encoded image"
          fill
          style={{ objectFit: 'cover' }}
          className="rounded-md"
        />
      </div>

      {!done ? (
        <Button
          onClick={saveAndEncode}
          disabled={saving}
          className="w-full"
          size="lg"
        >
          {saving && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {saving ? 'Encoding your message...' : 'Generate Encoded Image'}
        </Button>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2 rounded-md">
            <Check className="h-4 w-4" />
            Your message is hidden inside the image
          </div>

          <div className="flex flex-col items-center gap-2 w-full">
            <p className="text-sm font-medium text-slate-600">
              Post this image on Instagram / Facebook with this hashtag:
            </p>
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-md">
              <span className="font-mono font-bold text-lg">{hashtag}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyHashtag}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            Download Image
          </Button>

          <p className="text-xs text-slate-400 text-center">
            The image looks normal to anyone who sees it on social media.
            Only the admin dashboard can decode the hidden message.
          </p>

          <Button onClick={() => setShared(true)} className="mt-2">
            Finish
          </Button>
        </>
      )}
    </div>
  );
}

export default Share;
