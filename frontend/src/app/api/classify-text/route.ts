import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/text-decomposition`,
      { text: data.text }
    );
    return NextResponse.json(
      { decomposed: res.data.extracted_data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Text classification failed:', error);
    return NextResponse.json(
      { error: 'Failed to classify text' },
      { status: 500 }
    );
  }
}