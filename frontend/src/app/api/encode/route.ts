import axios from 'axios';
import FormData from 'form-data';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { imageURL, text } = await req.json();
    const imageResponse = await axios.get(imageURL, {
      responseType: 'arraybuffer',
    });
    const form = new FormData();
    form.append('file', Buffer.from(imageResponse.data), {
      filename: 'cover.png',
      contentType: 'image/png',
    });

    const encodeRes = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/encode`,
      form,
      {
        params: { text },
        headers: form.getHeaders(),
      }
    );

    const fullEncodedUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}${encodeRes.data.encoded_image_url}`;

    return NextResponse.json(
      { encodedImageURL: fullEncodedUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error('Image encoding failed:', error);
    return NextResponse.json(
      { error: 'Failed to encode image' },
      { status: 500 }
    );
  }
}