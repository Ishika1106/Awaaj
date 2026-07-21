import { NextResponse } from 'next/server';
import axios from 'axios';

interface GenerateImageRequestData {
  generatedText: string;
  imagePrompt: string;
}

export async function POST(req: Request) {
  try {
    const data: GenerateImageRequestData = await req.json();

    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/img-generation`,
      { prompt: data.imagePrompt }
    );

    return NextResponse.json({ images: res.data.images }, { status: 200 });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      return NextResponse.json(
        { detail: data.detail || 'Failed to generate images' },
        { status }
      );
    }
    console.error('Image generation failed:', error);
    return NextResponse.json(
      { detail: 'Failed to generate images. Please try again later.' },
      { status: 500 }
    );
  }
}