import { NextRequest, NextResponse } from "next/server";

/* ---------- types ---------- */
interface Notification {
  id: string;
  type: "view_milestone" | "upvote" | "follower" | "achievement" | "system" | "comment";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

/* ---------- demo data ---------- */
function getDemoNotifications(): Notification[] {
  const now = Date.now();
  return [
    { id: "n1", type: "view_milestone", title: "Views milestone", message: "Your sites reached 10,000 total views!", read: false, createdAt: new Date(now - 1_800_000).toISOString(), link: "/dashboard" },
    { id: "n2", type: "upvote", title: "New upvote", message: "Someone upvoted your Artisan Coffee Co. site in the gallery.", read: false, createdAt: new Date(now - 3_600_000).toISOString(), link: "/gallery" },
    { id: "n3", type: "follower", title: "New follower", message: "sarah_designs started following you.", read: false, createdAt: new Date(now - 7_200_000).toISOString(), link: "/profile/sarah_designs" },
    { id: "n4", type: "achievement", title: "Achievement unlocked", message: "You earned the '10 Sites Built' badge!", read: false, createdAt: new Date(now - 14_400_000).toISOString(), link: "/dashboard" },
    { id: "n5", type: "comment", title: "New comment", message: "alex_dev commented on your DevForge Studio build.", read: true, createdAt: new Date(now - 28_800_000).toISOString(), link: "/gallery" },
    { id: "n6", type: "system", title: "New generators available", message: "3 new generators added: Invoice, Proposal, and Contract.", read: true, createdAt: new Date(now - 43_200_000).toISOString(), link: "/generators" },
    { id: "n7", type: "upvote", title: "Trending build", message: "Your GreenLeaf Analytics site is trending in the gallery!", read: true, createdAt: new Date(now - 86_400_000).toISOString(), link: "/gallery" },
    { id: "n8", type: "follower", title: "New follower", message: "mike_agency started following you.", read: true, createdAt: new Date(now - 172_800_000).toISOString(), link: "/profile/mike_agency" },
    { id: "n9", type: "view_milestone", title: "Views milestone", message: "Your FitPro Gym site reached 500 views.", read: true, createdAt: new Date(now - 259_200_000).toISOString(), link: "/dashboard" },
    { id: "n10", type: "system", title: "Weekly report ready", message: "Your weekly business health report is available.", read: true, createdAt: new Date(now - 345_600_000).toISOString(), link: "/dashboard" },
    { id: "n11", type: "achievement", title: "Achievement unlocked", message: "You earned the 'First Deploy' badge!", read: true, createdAt: new Date(now - 432_000_000).toISOString(), link: "/dashboard" },
    { id: "n12", type: "comment", title: "New comment", message: "jenny_ux left feedback on your Nomad Threads site.", read: true, createdAt: new Date(now - 518_400_000).toISOString(), link: "/gallery" },
    { id: "n13", type: "upvote", title: "New upvote", message: "Your Launch Fast landing page got 5 new upvotes.", read: true, createdAt: new Date(now - 604_800_000).toISOString(), link: "/gallery" },
    { id: "n14", type: "system", title: "Plan reminder", message: "You have 3 builds remaining this month. Upgrade for unlimited.", read: true, createdAt: new Date(now - 691_200_000).toISOString(), link: "/pricing" },
    { id: "n15", type: "follower", title: "New follower", message: "creative_studio started following you.", read: true, createdAt: new Date(now - 777_600_000).toISOString(), link: "/profile/creative_studio" },
  ];
}

/* ---------- GET: return notifications ---------- */
export async function GET() {
  const notifications = getDemoNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json({
    notifications,
    unreadCount,
    total: notifications.length,
  });
}

/* ---------- POST: mark as read ---------- */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (action === "mark_all_read") {
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (id) {
      return NextResponse.json({ success: true, message: `Notification ${id} marked as read.` });
    }

    return NextResponse.json({ error: "Provide 'id' or {action: 'mark_all_read'}." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}

/* ---------- DELETE: clear all ---------- */
export async function DELETE() {
  return NextResponse.json({ success: true, message: "All notifications cleared." });
}
