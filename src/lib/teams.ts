import { randomBytes } from "crypto";
import { sql } from "@/lib/db";

export type Role = "owner" | "admin" | "editor" | "viewer";

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  email: string;
  role: Role;
  joined_at: string;
}

export interface TeamInvite {
  id: string;
  team_id: string;
  email: string;
  role: Role;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export type Action = "read" | "write" | "manage_members" | "delete_team";

let _tablesEnsured = false;

export async function ensureTeamTables(): Promise<void> {
  if (_tablesEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('owner','admin','editor','viewer')),
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(team_id, user_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS team_invites (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('owner','admin','editor','viewer')),
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      accepted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  _tablesEnsured = true;
}

function firstRow<T>(rows: unknown): T | null {
  const arr = rows as T[];
  return arr && arr.length > 0 ? arr[0] : null;
}

export async function createTeam(ownerId: string, name: string): Promise<Team> {
  await ensureTeamTables();
  const rows = (await sql`
    INSERT INTO teams (name, owner_id) VALUES (${name}, ${ownerId})
    RETURNING id, name, owner_id, created_at
  `) as Team[];
  const team = rows[0];
  await sql`
    INSERT INTO team_members (team_id, user_id, email, role)
    VALUES (${team.id}, ${ownerId}, ${ownerId}, 'owner')
    ON CONFLICT (team_id, user_id) DO NOTHING
  `;
  return team;
}

async function sendInviteEmail(email: string, acceptUrl: string, teamName: string): Promise<void> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!apiKey || !domain) return;
  try {
    const body = new URLSearchParams({
      from: `Zoobicon <noreply@${domain}>`,
      to: email,
      subject: `You're invited to join ${teamName} on Zoobicon`,
      text: `You've been invited to join ${teamName}. Accept here: ${acceptUrl}`,
      html: `<p>You've been invited to join <strong>${teamName}</strong> on Zoobicon.</p><p><a href="${acceptUrl}">Accept invitation</a></p>`,
    });
    await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
  } catch (err) {
    console.warn("[teams] invite email failed:", err);
  }
}

export async function inviteMember(
  teamId: string,
  email: string,
  role: Role,
  invitedBy: string
): Promise<{ invite: TeamInvite; acceptUrl: string }> {
  await ensureTeamTables();
  const inviter = await getMembership(teamId, invitedBy);
  if (!inviter || !hasPermission(inviter, "manage_members")) {
    throw new Error("Not authorized to invite members");
  }
  if (role === "owner") {
    throw new Error("Cannot invite as owner");
  }
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const rows = (await sql`
    INSERT INTO team_invites (team_id, email, role, token, expires_at)
    VALUES (${teamId}, ${email}, ${role}, ${token}, ${expiresAt})
    RETURNING id, team_id, email, role, token, expires_at, accepted_at, created_at
  `) as TeamInvite[];
  const invite = rows[0];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zoobicon.com";
  const acceptUrl = `${baseUrl}/teams/accept?token=${token}`;
  const teamRows = (await sql`SELECT name FROM teams WHERE id = ${teamId}`) as { name: string }[];
  const teamName = teamRows[0]?.name ?? "a team";
  await sendInviteEmail(email, acceptUrl, teamName);
  return { invite, acceptUrl };
}

export async function acceptInvite(token: string, userId: string): Promise<TeamMember> {
  await ensureTeamTables();
  const rows = (await sql`
    SELECT id, team_id, email, role, token, expires_at, accepted_at, created_at
    FROM team_invites WHERE token = ${token}
  `) as TeamInvite[];
  const invite = rows[0];
  if (!invite) throw new Error("Invite not found");
  if (invite.accepted_at) throw new Error("Invite already accepted");
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    throw new Error("Invite expired");
  }
  const memberRows = (await sql`
    INSERT INTO team_members (team_id, user_id, email, role)
    VALUES (${invite.team_id}, ${userId}, ${invite.email}, ${invite.role})
    ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role
    RETURNING id, team_id, user_id, email, role, joined_at
  `) as TeamMember[];
  await sql`UPDATE team_invites SET accepted_at = NOW() WHERE id = ${invite.id}`;
  return memberRows[0];
}

export async function listMembers(teamId: string): Promise<TeamMember[]> {
  await ensureTeamTables();
  const rows = (await sql`
    SELECT id, team_id, user_id, email, role, joined_at
    FROM team_members WHERE team_id = ${teamId}
    ORDER BY joined_at ASC
  `) as TeamMember[];
  return rows;
}

export async function getMembership(
  teamId: string,
  userId: string
): Promise<TeamMember | null> {
  await ensureTeamTables();
  const rows = (await sql`
    SELECT id, team_id, user_id, email, role, joined_at
    FROM team_members WHERE team_id = ${teamId} AND user_id = ${userId}
    LIMIT 1
  `) as TeamMember[];
  return firstRow<TeamMember>(rows);
}

export async function removeMember(
  teamId: string,
  userId: string,
  removedBy: string
): Promise<void> {
  await ensureTeamTables();
  const remover = await getMembership(teamId, removedBy);
  if (!remover || !hasPermission(remover, "manage_members")) {
    throw new Error("Not authorized to remove members");
  }
  const target = await getMembership(teamId, userId);
  if (!target) throw new Error("Member not found");
  if (target.role === "owner") throw new Error("Cannot remove team owner");
  await sql`
    DELETE FROM team_members WHERE team_id = ${teamId} AND user_id = ${userId}
  `;
}

export async function updateRole(
  teamId: string,
  userId: string,
  newRole: Role,
  updatedBy: string
): Promise<TeamMember> {
  await ensureTeamTables();
  const updater = await getMembership(teamId, updatedBy);
  if (!updater || !hasPermission(updater, "manage_members")) {
    throw new Error("Not authorized to update roles");
  }
  if (newRole === "owner") throw new Error("Cannot assign owner role");
  const target = await getMembership(teamId, userId);
  if (!target) throw new Error("Member not found");
  if (target.role === "owner") throw new Error("Cannot change owner role");
  const rows = (await sql`
    UPDATE team_members SET role = ${newRole}
    WHERE team_id = ${teamId} AND user_id = ${userId}
    RETURNING id, team_id, user_id, email, role, joined_at
  `) as TeamMember[];
  return rows[0];
}

export function hasPermission(
  membership: TeamMember | null,
  action: Action
): boolean {
  if (!membership) return false;
  const role = membership.role;
  switch (action) {
    case "read":
      return ["owner", "admin", "editor", "viewer"].includes(role);
    case "write":
      return ["owner", "admin", "editor"].includes(role);
    case "manage_members":
      return ["owner", "admin"].includes(role);
    case "delete_team":
      return role === "owner";
    default:
      return false;
  }
}
