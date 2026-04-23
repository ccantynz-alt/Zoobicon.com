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
  // AdminShell is the single auth gate — see src/app/admin/AdminShell.tsx.
  // A duplicated check here used to race against it and flash redirects.
  const [isAdmin] = useState(true);
  const [services, setServices] = useState<BookingService[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [expandedService, setExpandedService] = useState<string | null>(null);

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
    if (s === "confirmed" || s === "completed") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    if (s === "pending") return "bg-amber-50 text-amber-700 border border-amber-200";
    if (s === "cancelled") return "bg-red-50 text-red-700 border border-red-200";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800">
            <Calendar className="w-6 h-6 text-indigo-500" />
            Booking Management
          </h1>
          <p className="text-sm text-slate-700 mt-1">
            Provider:{" "}
            <span
              className={`font-mono ${
                provider === "mock" ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {provider || "detecting..."}
            </span>
            {provider === "mock" && (
              <span className="ml-2 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                Mock Mode — add CALCOM_API_KEY to go live
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-sm text-slate-700 transition-colors"
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search by client name or email..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-700
                     placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Appointments Table */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Appointments
              <span className="text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
                {filteredAppointments.length} total
              </span>
            </h2>

            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12 text-slate-600 rounded-2xl bg-slate-50 border border-slate-200">
                <Calendar className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No appointments found</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-slate-600 uppercase tracking-wider border-b border-slate-200">
                      <th className="text-left px-5 py-3">Client</th>
                      <th className="text-left px-3 py-3">Service</th>
                      <th className="text-left px-3 py-3">Date & Time</th>
                      <th className="text-left px-3 py-3">Status</th>
                      <th className="text-left px-5 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAppointments.map((appt) => {
                      const svc = services.find((s) => s.id === appt.bookingTypeId);
                      return (
                        <tr key={appt.id} className="hover:bg-slate-50/60">
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-slate-800">{appt.clientName}</p>
                            <p className="text-xs text-slate-600">{appt.clientEmail}</p>
                          </td>
                          <td className="px-3 py-3 text-sm text-slate-600">
                            {svc?.name || appt.bookingTypeId || "—"}
                          </td>
                          <td className="px-3 py-3 text-sm text-slate-700">
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
                          <td className="px-5 py-3 text-sm text-slate-700 max-w-xs truncate">
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
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
              <DollarSign className="w-5 h-5 text-indigo-500" />
              Services
              <span className="text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
                {services.length} total
              </span>
            </h2>

            {services.length === 0 ? (
              <div className="text-center py-12 text-slate-600 rounded-2xl bg-slate-50 border border-slate-200">
                <DollarSign className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No services configured</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((svc) => (
                  <div
                    key={svc.id}
                    className="rounded-2xl bg-white border border-slate-200 overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedService(
                          expandedService === svc.id ? null : svc.id
                        )
                      }
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: svc.color || "#6366f1" }}
                        />
                        <span className="font-medium text-slate-800">{svc.name}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            svc.enabled
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {svc.enabled ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-700">
                          {svc.duration} min
                        </span>
                        <span className="text-sm font-mono text-slate-700">
                          {svc.price === 0 ? "Free" : `$${svc.price}`}
                        </span>
                        {expandedService === svc.id ? (
                          <ChevronDown className="w-4 h-4 text-slate-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                    </button>

                    {expandedService === svc.id && (
                      <div className="border-t border-slate-200 px-5 py-4 bg-slate-50/50">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600 text-xs mb-1">
                              Description
                            </p>
                            <p className="text-slate-600">
                              {svc.description || "No description"}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600 text-xs mb-1">
                              Location
                            </p>
                            <p className="text-slate-600 capitalize">
                              {svc.location}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600 text-xs mb-1">
                              Currency
                            </p>
                            <p className="text-slate-600">{svc.currency}</p>
                          </div>
                          <div>
                            <p className="text-slate-600 text-xs mb-1">ID</p>
                            <p className="text-slate-600 font-mono text-xs">
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
    indigo: "from-indigo-50 to-indigo-100/50 border-indigo-200/60",
    cyan: "from-cyan-50 to-cyan-100/50 border-cyan-200/60",
    emerald: "from-emerald-50 to-emerald-100/50 border-emerald-200/60",
    amber: "from-amber-50 to-amber-100/50 border-amber-200/60",
  };
  const iconMap: Record<string, string> = {
    indigo: "text-indigo-500",
    cyan: "text-cyan-500",
    emerald: "text-emerald-500",
    amber: "text-amber-500",
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colorMap[color]} border p-4`}>
      <Icon className={`w-5 h-5 ${iconMap[color]} mb-2`} />
      <p className="text-xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-700 mt-0.5">{label}</p>
    </div>
  );
}
