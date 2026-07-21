'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { useState } from 'react';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const FormSchema = z.object({
  generatedText: z.string(),
  imagePrompt: z
    .string()
    .min(3, { message: 'Please specify the image prompt.' }),
});

export default function ImageGen({
  text,
  setResImage,
}: {
  text: string;
  setResImage: (resImage: string) => void;
}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      generatedText: text || '',
      imagePrompt: '',
    },
  });

  const [imageOptions, setImageOptions] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const promptSuggestions = [
    'Good Morning',
    'Good Night',
    'Sunset',
    'Sunrise',
    'Ocean',
  ];

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/generate-image', data);
      const fullUrls = (res.data.images as string[]).map(
        (path) => `${BACKEND_URL}${path}`
      );
      setImageOptions(fullUrls);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) &&
        err.response?.data?.detail
          ? err.response.data.detail
          : 'Failed to generate image. Please try again.';
      setError(msg);
      console.error('Error generating images:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    form.setValue('imagePrompt', suggestion);
  };

  const handleImageSelect = (imageUrl: string) => {
    setResImage(imageUrl);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-4xl mx-auto space-y-9 w-full"
      >
        <FormField
          control={form.control}
          name="generatedText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Generated Text</FormLabel>
              <FormControl>
                <Textarea {...field} rows={8} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imagePrompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image Prompt</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter Image Prompt (e.g., Good Morning, Sunset)"
                  {...field}
                />
              </FormControl>
              <div className="flex gap-2 mt-2 flex-wrap">
                {promptSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="bg-orange-100 text-orange-700 text-sm px-3 py-1 rounded-xl hover:bg-orange-200 transition duration-150"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          Generate Image
        </Button>
      </form>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="mt-0.5 text-lg leading-none">&#9888;</span>
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Generating Image...</h2>
          <Skeleton className="h-[384px] w-full bg-orange-200 rounded-md" />
        </div>
      ) : imageOptions && imageOptions.length > 0 ? (
        <div className="mt-6 space-y-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Generated Image</h2>
          <div
            className="cursor-pointer shadow hover:shadow-lg hover:scale-[1.02] duration-200 rounded-md overflow-hidden border border-gray-200 hover:border-orange-400 max-w-md mx-auto"
            onClick={() => handleImageSelect(imageOptions[0])}
          >
            <div className="relative w-full h-80 overflow-hidden">
              <Image
                src={imageOptions[0]}
                alt="Generated Image"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
          <p className="text-center text-sm text-gray-500">Click the image to select it</p>
        </div>
      ) : null}
    </Form>
  );
}
