"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  RefreshCw,
  Users,
  Clock,
  Search,
  ChevronDown,
  ChevronRight,
  Loader2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface BookingService {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  currency: string;
  color: string;
  location: string;
  enabled: boolean;
}

interface Appointment {
  id: string;
  bookingTypeId: string;
  clientName: string;
  clientEmail: string;
  dateTime: string;
  endTime: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  notes?: string;
}

export default function AdminBookingPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [services, setServices] = useState<BookingService[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [expandedService, setExpandedService] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (!raw) { window.location.href = "/auth/login"; return; }
      const user = JSON.parse(raw);
      if (user.role !== "admin") { window.location.href = "/dashboard"; return; }
      setIsAdmin(true);
    } catch {
      window.location.href = "/auth/login";
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [servicesRes, appointmentsRes] = await Promise.allSettled([
        fetch("/api/v1/booking/services"),
        fetch("/api/v1/booking/appointments"),
      ]);

      if (servicesRes.status === "fulfilled" && servicesRes.value.ok) {
        const data = await servicesRes.value.json();
        setServices(data.services || data || []);
        setProvider(data.provider || (Array.isArray(data) ? "mock" : "unknown"));
      } else {
        setServices([]);
        setProvider("mock");
      }

      if (appointmentsRes.status === "fulfilled" && appointmentsRes.value.ok) {
        const data = await appointmentsRes.value.json();
        setAppointments(data.appointments || data || []);
      } else {
        setAppointments([]);
      }
    } catch {
      setServices([]);
      setAppointments([]);
      setProvider("mock");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  if (!isAdmin) return null;

  const today = new Date().toISOString().split("T")[0];
  const todaysAppointments = appointments.filter(
    (a) => a.dateTime.startsWith(today)
  );

  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;

  const filteredAppointments = appointments.filter(
    (a) =>
      !searchFilter ||
      a.clientName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.clientEmail.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const statusColor = (s: string) => {
    if (s === "confirmed" || s === "completed") return "bg-emerald-500/20 text-emerald-400";
    if (s === "pending") return "bg-amber-500/20 text-amber-400";
    if (s === "cancelled") return "bg-red-500/20 text-red-400";
    return "bg-white/10 text-white/60";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Calendar className="w-6 h-6 text-indigo-400" />
            Booking Management
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Provider:{" "}
            <span
              className={`font-mono ${
                provider === "mock" ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {provider || "detecting..."}
            </span>
            {provider === "mock" && (
              <span className="ml-2 text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">
                Mock Mode — add CALCOM_API_KEY to go live
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Total Services"
          value={services.length}
          color="indigo"
        />
        <StatCard
          icon={Clock}
          label="Today's Appointments"
          value={todaysAppointments.length}
          color="cyan"
        />
        <StatCard
          icon={CheckCircle2}
          label="Confirmed"
          value={confirmedCount}
          color="emerald"
        />
        <StatCard
          icon={AlertCircle}
          label="Pending"
          value={pendingCount}
          color="amber"
        />
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search by client name or email..."
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm
                     placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Appointments Table */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              Appointments
              <span className="text-xs text-white/30 bg-white/[0.05] px-2 py-0.5 rounded-full ml-2">
                {filteredAppointments.length} total
              </span>
            </h2>

            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12 text-white/30 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <Calendar className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No appointments found</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-[11px] text-white/30 uppercase tracking-wider border-b border-white/[0.06]">
                      <th className="text-left px-5 py-3">Client</th>
                      <th className="text-left px-3 py-3">Service</th>
                      <th className="text-left px-3 py-3">Date & Time</th>
                      <th className="text-left px-3 py-3">Status</th>
                      <th className="text-left px-5 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredAppointments.map((appt) => {
                      const svc = services.find((s) => s.id === appt.bookingTypeId);
                      return (
                        <tr key={appt.id} className="hover:bg-white/[0.02]">
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium">{appt.clientName}</p>
                            <p className="text-[10px] text-white/25">{appt.clientEmail}</p>
                          </td>
                          <td className="px-3 py-3 text-sm text-white/60">
                            {svc?.name || appt.bookingTypeId || "—"}
                          </td>
                          <td className="px-3 py-3 text-sm text-white/50">
                            {new Date(appt.dateTime).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            at{" "}
                            {new Date(appt.dateTime).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor(
                                appt.status
                              )}`}
                            >
                              {appt.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-white/40 max-w-xs truncate">
                            {appt.notes || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Services List */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Services
              <span className="text-xs text-white/30 bg-white/[0.05] px-2 py-0.5 rounded-full ml-2">
                {services.length} total
              </span>
            </h2>

            {services.length === 0 ? (
              <div className="text-center py-12 text-white/30 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <DollarSign className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No services configured</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((svc) => (
                  <div
                    key={svc.id}
                    className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedService(
                          expandedService === svc.id ? null : svc.id
                        )
                      }
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: svc.color || "#6366f1" }}
                        />
                        <span className="font-medium">{svc.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            svc.enabled
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-white/[0.05] text-white/40"
                          }`}
                        >
                          {svc.enabled ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-white/40">
                          {svc.duration} min
                        </span>
                        <span className="text-sm font-mono text-emerald-400">
                          {svc.price === 0 ? "Free" : `$${svc.price}`}
                        </span>
                        {expandedService === svc.id ? (
                          <ChevronDown className="w-4 h-4 text-white/30" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-white/30" />
                        )}
                      </div>
                    </button>

                    {expandedService === svc.id && (
                      <div className="border-t border-white/[0.06] px-5 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-white/30 text-xs mb-1">
                              Description
                            </p>
                            <p className="text-white/60">
                              {svc.description || "No description"}
                            </p>
                          </div>
                          <div>
                            <p className="text-white/30 text-xs mb-1">
                              Location
                            </p>
                            <p className="text-white/60 capitalize">
                              {svc.location}
                            </p>
                          </div>
                          <div>
                            <p className="text-white/30 text-xs mb-1">
                              Currency
                            </p>
                            <p className="text-white/60">{svc.currency}</p>
                          </div>
                          <div>
                            <p className="text-white/30 text-xs mb-1">ID</p>
                            <p className="text-white/25 font-mono text-[10px]">
                              {svc.id}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "from-indigo-500/10 to-indigo-500/5 border-indigo-500/15",
    cyan: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/15",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/15",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-500/15",
  };
  const iconMap: Record<string, string> = {
    indigo: "text-indigo-400",
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colorMap[color]} border p-4`}>
      <Icon className={`w-5 h-5 ${iconMap[color]} mb-2`} />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[11px] text-white/40 mt-0.5">{label}</p>
    </div>
  );
}
