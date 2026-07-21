import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

interface CloseIssueRequest {
  issueId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { issueId } = (await request.json()) as CloseIssueRequest;
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/close-issue/${issueId}`
    );
    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error('Close issue error:', error);
    const message =
      axios.isAxiosError(error) && error.response?.data?.detail
        ? error.response.data.detail
        : 'Failed to close issue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
