import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const { postId } = await request.json();
    const response = await axios.delete(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/delete-post/${postId}`
    );
    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error('Delete post error:', error);
    const message =
      axios.isAxiosError(error) && error.response?.data?.detail
        ? error.response.data.detail
        : 'Failed to delete post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
