import { runTechScout } from "@/lib/intelligence-system";

export const maxDuration = 120;

export async function GET(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runTechScout();
  return Response.json({ timestamp: new Date().toISOString(), ...result });
}
