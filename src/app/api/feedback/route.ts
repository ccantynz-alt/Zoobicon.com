import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'votes';

  const requests = [
    { id: '1', title: 'Dark mode for generated sites', description: 'Allow users to toggle dark/light mode on their generated websites', votes: 234, status: 'shipped', category: 'Builder', author: 'Sarah C.', comments: 12 },
    { id: '2', title: 'Custom font uploads', description: 'Let us upload and use our own brand fonts in generated sites', votes: 189, status: 'in_progress', category: 'Builder', author: 'Mike W.', comments: 8 },
    { id: '3', title: 'Figma plugin for direct import', description: 'Import Figma designs directly into the builder without manual export', votes: 156, status: 'planned', category: 'Integrations', author: 'Emma R.', comments: 15 },
    { id: '4', title: 'Team collaboration workspaces', description: 'Allow multiple team members to work on the same project simultaneously', votes: 312, status: 'planned', category: 'Collaboration', author: 'James P.', comments: 23 },
    { id: '5', title: 'WordPress headless CMS integration', description: 'Use WordPress as a headless CMS for Zoobicon-generated sites', votes: 98, status: 'under_review', category: 'Integrations', author: 'Lisa T.', comments: 6 },
    { id: '6', title: 'Mobile app builder', description: 'Generate React Native mobile apps alongside web apps', votes: 445, status: 'under_review', category: 'Platform', author: 'David K.', comments: 34 },
    { id: '7', title: 'AI image editing within builder', description: 'Edit generated images directly in the builder with AI tools', votes: 267, status: 'in_progress', category: 'AI', author: 'Rachel G.', comments: 19 },
    { id: '8', title: 'Offline mode for builder', description: 'Allow basic editing when internet connection is unstable', votes: 78, status: 'declined', category: 'Platform', author: 'Tom H.', comments: 4 },
  ];

  const sorted = sort === 'votes' ? requests.sort((a, b) => b.votes - a.votes) : requests.sort((a, b) => b.comments - a.comments);

  return NextResponse.json({ requests: sorted, totalVotes: requests.reduce((s, r) => s + r.votes, 0) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === 'create') {
      return NextResponse.json({ id: `fr_${Date.now()}`, ...data, votes: 1, status: 'new', comments: 0, createdAt: new Date().toISOString() });
    }
    if (action === 'vote') {
      return NextResponse.json({ id: data.requestId, voted: true });
    }
    if (action === 'comment') {
      return NextResponse.json({ id: `comment_${Date.now()}`, requestId: data.requestId, content: data.content, createdAt: new Date().toISOString() });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process feedback' }, { status: 500 });
  }
}