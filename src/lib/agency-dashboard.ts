/**
 * Agency White-Label Dashboard (#30)
 *
 * Resellers manage their clients, billing, sites from one panel.
 * Each agency at $499/mo brings 20-50 clients = massive multiplier.
 *
 * Features:
 *   - Agency branding (logo, colors, custom domain)
 *   - Client management (add/remove clients, set plans)
 *   - Site management (view all client sites, usage, analytics)
 *   - Billing management (invoices, revenue tracking)
 *   - Sub-user permissions (designer, admin, viewer roles)
 *   - White-label: customers never see "Zoobicon"
 */

import { sql } from "./db";

// Agency tables already exist in db.ts (agencies, agency_members, agency_clients, agency_client_sites)

export interface AgencyDashboardData {
  agency: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    brandConfig: Record<string, unknown>;
  };
  stats: {
    totalClients: number;
    totalSites: number;
    totalMembers: number;
    monthlyGenerations: number;
    mrr: number;
  };
  clients: Array<{
    id: string;
    name: string;
    email: string;
    company: string;
    siteCount: number;
    status: string;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
}

/**
 * Get complete dashboard data for an agency.
 */
export async function getAgencyDashboard(agencyId: string): Promise<AgencyDashboardData> {
  const [agency] = await sql`
    SELECT id, name, slug, plan, brand_config, settings FROM agencies WHERE id = ${agencyId}
  `;

  if (!agency) throw new Error("Agency not found");

  // Get stats
  const [clientCount] = await sql`SELECT COUNT(*) as count FROM agency_clients WHERE agency_id = ${agencyId} AND status = 'active'`;
  const [siteCount] = await sql`SELECT COUNT(*) as count FROM agency_client_sites WHERE agency_id = ${agencyId} AND status = 'active'`;
  const [memberCount] = await sql`SELECT COUNT(*) as count FROM agency_members WHERE agency_id = ${agencyId} AND status = 'active'`;
  const [genCount] = await sql`
    SELECT COUNT(*) as count FROM agency_generations
    WHERE agency_id = ${agencyId} AND period = ${new Date().toISOString().slice(0, 7)}
  `;

  // Get clients with site counts
  const clients = await sql`
    SELECT c.id, c.name, c.email, c.company, c.status,
           (SELECT COUNT(*) FROM agency_client_sites s WHERE s.client_id = c.id AND s.status = 'active') as site_count
    FROM agency_clients c WHERE c.agency_id = ${agencyId}
    ORDER BY c.created_at DESC LIMIT 50
  `;

  return {
    agency: {
      id: agency.id as string,
      name: agency.name as string,
      slug: agency.slug as string,
      plan: agency.plan as string,
      brandConfig: (agency.brand_config as Record<string, unknown>) || {},
    },
    stats: {
      totalClients: parseInt(clientCount?.count as string) || 0,
      totalSites: parseInt(siteCount?.count as string) || 0,
      totalMembers: parseInt(memberCount?.count as string) || 0,
      monthlyGenerations: parseInt(genCount?.count as string) || 0,
      mrr: (parseInt(clientCount?.count as string) || 0) * 49, // Estimated from client count
    },
    clients: clients.map(c => ({
      id: c.id as string,
      name: c.name as string,
      email: (c.email as string) || "",
      company: (c.company as string) || "",
      siteCount: parseInt(c.site_count as string) || 0,
      status: c.status as string,
    })),
    recentActivity: [], // TODO: Activity feed from agency_generations + client_sites
  };
}

/**
 * Update agency branding (white-label configuration).
 */
export async function updateAgencyBrand(
  agencyId: string,
  brandConfig: {
    logo?: string;
    primaryColor?: string;
    companyName?: string;
    customDomain?: string;
    hideZoobicon?: boolean;
  }
): Promise<void> {
  await sql`
    UPDATE agencies
    SET brand_config = ${JSON.stringify(brandConfig)}, updated_at = NOW()
    WHERE id = ${agencyId}
  `;
}

/**
 * Add a client to an agency.
 */
export async function addAgencyClient(
  agencyId: string,
  client: { name: string; email?: string; company?: string; notes?: string }
): Promise<string> {
  const [row] = await sql`
    INSERT INTO agency_clients (agency_id, name, email, company, notes)
    VALUES (${agencyId}, ${client.name}, ${client.email || null}, ${client.company || null}, ${client.notes || null})
    RETURNING id
  `;
  return row.id as string;
}

/**
 * Invite a team member to the agency.
 */
export async function inviteAgencyMember(
  agencyId: string,
  email: string,
  name: string,
  role: "admin" | "designer" | "viewer" = "designer"
): Promise<void> {
  await sql`
    INSERT INTO agency_members (agency_id, email, name, role)
    VALUES (${agencyId}, ${email}, ${name}, ${role})
    ON CONFLICT (agency_id, email) DO UPDATE SET role = ${role}, status = 'active'
  `;
}
