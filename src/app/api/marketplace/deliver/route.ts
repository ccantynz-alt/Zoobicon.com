import { NextRequest } from "next/server";
import {
  getUserAddons,
  getAddonDelivery,
  injectAddonCode,
  injectAllUserAddons,
  ensureMarketplaceTables,
} from "@/lib/addon-delivery";

/**
 * POST /api/marketplace/deliver — Inject add-on code into site HTML
 *
 * Body: {
 *   action: "inject-single" | "inject-all" | "preview",
 *   addonId?: string,
 *   html: string,
 *   email: string,
 *   config?: Record<string, string>,
 *   addonConfigs?: Record<string, Record<string, string>>
 * }
 */
export async function POST(req: NextRequest) {
  try {
    await ensureMarketplaceTables();
    const body = await req.json();
    const { action, addonId, html, email, config, addonConfigs } = body;

    if (!html || typeof html !== "string") {
      return Response.json({ error: "html is required" }, { status: 400 });
    }

    switch (action) {
      case "inject-single": {
        if (!addonId) {
          return Response.json({ error: "addonId required" }, { status: 400 });
        }

        const delivery = getAddonDelivery(addonId, config);
        if (!delivery) {
          return Response.json({ error: `No delivery handler for ${addonId}` }, { status: 404 });
        }

        const result = injectAddonCode(html, delivery);
        return Response.json({
          html: result,
          delivery: {
            addonId: delivery.addonId,
            injectionPoint: delivery.injectionPoint,
            description: delivery.description,
            configRequired: delivery.configRequired,
          },
        });
      }

      case "inject-all": {
        if (!email) {
          return Response.json({ error: "email required" }, { status: 400 });
        }

        const result = await injectAllUserAddons(html, email, addonConfigs);
        const purchases = await getUserAddons(email);

        return Response.json({
          html: result,
          injectedAddons: purchases.map((p) => p.addonId),
          addonCount: purchases.length,
        });
      }

      case "preview": {
        // Preview what an add-on would inject without requiring a purchase
        if (!addonId) {
          return Response.json({ error: "addonId required" }, { status: 400 });
        }

        const delivery = getAddonDelivery(addonId, config);
        if (!delivery) {
          return Response.json({ error: `No delivery handler for ${addonId}` }, { status: 404 });
        }

        return Response.json({
          addonId: delivery.addonId,
          injectionPoint: delivery.injectionPoint,
          description: delivery.description,
          code: delivery.code,
          configRequired: delivery.configRequired,
        });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error("[marketplace/deliver] Error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Delivery error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/marketplace/deliver?email=xxx — Get user's installed add-ons
 */
export async function GET(req: NextRequest) {
  try {
    await ensureMarketplaceTables();
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return Response.json({ error: "email required" }, { status: 400 });
    }

    const purchases = await getUserAddons(email);

    // Enrich with delivery info
    const addons = purchases.map((p) => {
      const delivery = getAddonDelivery(p.addonId);
      return {
        ...p,
        hasDelivery: !!delivery,
        injectionPoint: delivery?.injectionPoint,
        description: delivery?.description,
        configRequired: delivery?.configRequired,
      };
    });

    return Response.json({ addons, count: addons.length });
  } catch (err) {
    console.error("[marketplace/deliver] GET Error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to fetch addons" },
      { status: 500 }
    );
  }
}
