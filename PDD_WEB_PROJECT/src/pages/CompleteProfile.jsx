import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { saveCompleteProfile } from '@/api/profiles';
import { useAuth } from "@/lib/AuthContext";
import { getDashboardPath, isPoliceRole, AUTH_ROLES } from "@/lib/authRouting";
import { useLanguage } from "../lib/LanguageContext";
import { useTranslation } from "../lib/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const PILOT_DATA = {
  Visakhapatnam: {
    mandals: ["Gajuwaka", "Bheemunipatnam", "Anakapalli", "Vizag Urban", "Rushikonda"],
    stations: {
      Gajuwaka: ["Gajuwaka PS", "Steel Plant PS", "Kommadi PS"],
      Bheemunipatnam: ["Bheemunipatnam PS", "Nakkapalli PS"],
      Anakapalli: ["Anakapalli PS", "Yelamanchili PS"],
      "Vizag Urban": ["Town PS Visakhapatnam", "Dwaraka Nagar PS", "MVP Colony PS"],
      Rushikonda: ["Rushikonda PS", "Madhurawada PS"],
    },
  },
  Krishna: {
    mandals: ["Vijayawada Urban", "Benz Circle", "Auto Nagar", "Machilipatnam", "Nandigama"],
    stations: {
      "Vijayawada Urban": ["Vijayawada Town PS", "One Town PS", "Suryaraopet PS"],
      "Benz Circle": ["Benz Circle PS", "Patamata PS"],
      "Auto Nagar": ["Auto Nagar PS", "Gunadala PS"],
      Machilipatnam: ["Machilipatnam Town PS", "Bantumilli PS"],
      Nandigama: ["Nandigama PS", "Tiruvuru PS"],
    },
  },
  Guntur: {
    mandals: ["Guntur Urban", "Brodipet", "Tenali", "Mangalagiri", "Narasaraopet"],
    stations: {
      "Guntur Urban": ["Guntur Town PS", "Arundelpet PS", "Pattabhipuram PS"],
      Brodipet: ["Brodipet PS", "Collectorate PS"],
      Tenali: ["Tenali PS", "Repalle PS"],
      Mangalagiri: ["Mangalagiri PS", "Tadepalle PS"],
      Narasaraopet: ["Narasaraopet PS", "Vinukonda PS"],
    },
  },
  Nellore: {
    mandals: ["Nellore Urban", "Kavali", "Gudur", "Atmakur", "Sullurpeta"],
    stations: {
      "Nellore Urban": ["Nellore Town PS", "Old Town PS", "Santhapet PS"],
      Kavali: ["Kavali PS", "Allur PS"],
      Gudur: ["Gudur PS", "Venkatagiri PS"],
      Atmakur: ["Atmakur PS"],
      Sullurpeta: ["Sullurpeta PS", "Naidupeta PS"],
    },
  },
  Chittoor: {
    mandals: ["Tirupati Urban", "Chittoor Town", "Madanapalle", "Puttur", "Srikalahasti"],
    stations: {
      "Tirupati Urban": ["Tirupati Urban PS", "Alipiri PS", "Tiruchanur PS"],
      "Chittoor Town": ["Chittoor Town PS", "Kuppam PS"],
      Madanapalle: ["Madanapalle PS", "Punganur PS"],
      Puttur: ["Puttur PS", "Nagari PS"],
      Srikalahasti: ["Srikalahasti PS", "Renigunta PS"],
    },
  },
};

const PILOT_DISTRICTS = Object.keys(PILOT_DATA);

const DESIGNATION_MAP = {
  [AUTH_ROLES.CITIZEN]: [],
  [AUTH_ROLES.POLICE_OFFICER]: ["Constable", "Head Constable", "ASI", "SI"],
  [AUTH_ROLES.STATION_OFFICER]: ["Sub-Inspector (SI)", "ASI", "Station House Officer"],
  [AUTH_ROLES.DSP]: ["Deputy Superintendent of Police (DSP)"],
  [AUTH_ROLES.LAWYER]: [],
  [AUTH_ROLES.COURT_OFFICER]: ["Additional District Judge", "Civil Judge", "Magistrate", "Sessions Judge"],
  [AUTH_ROLES.ADMINISTRATOR]: ["System Administrator"],
};

function normalizeLegacyRole(role) {
  const r = (role || "citizen").toLowerCase();
  const map = {
    citizen: AUTH_ROLES.CITIZEN,
    police: AUTH_ROLES.POLICE_OFFICER,
    police_officer: AUTH_ROLES.POLICE_OFFICER,
    police_station: AUTH_ROLES.STATION_OFFICER,
    station_officer: AUTH_ROLES.STATION_OFFICER,
    si: AUTH_ROLES.STATION_OFFICER,
    ci: AUTH_ROLES.STATION_OFFICER,
    dsp: AUTH_ROLES.DSP,
    lawyer: AUTH_ROLES.LAWYER,
    court: AUTH_ROLES.COURT_OFFICER,
    court_officer: AUTH_ROLES.COURT_OFFICER,
    admin: AUTH_ROLES.ADMINISTRATOR,
    administrator: AUTH_ROLES.ADMINISTRATOR,
    dgp: AUTH_ROLES.ADMINISTRATOR,
  };
  return map[r] || AUTH_ROLES.CITIZEN;
}

export default function CompleteProfile() {
  const { lang } = useLanguage();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const { user, profile, refreshProfile, isLoadingAuth, isAuthenticated } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [loading, setLoading] = useState(false);

  const metaRole = user?.user_metadata?.role;
  const [form, setForm] = useState({
    role: AUTH_ROLES.CITIZEN,
    phone: "",
    district: "",
    mandal: "",
    station: "",
    designation: "",
    department: "general",
  });

  useEffect(() => {
    if (isLoadingAuth) return;

    if (!isAuthenticated || !user) {
      navigate("/login", { replace: true });
      return;
    }

    if (profile?.profile_completed) {
      navigate(getDashboardPath(profile.role), { replace: true });
      return;
    }

    setForm((prev) => ({
      ...prev,
      role: normalizeLegacyRole(metaRole || profile?.role || prev.role),
      phone: profile?.phone || prev.phone,
      district: profile?.district || prev.district,
      mandal: profile?.mandal || prev.mandal,
      station: profile?.police_station || prev.station,
      designation: profile?.designation || prev.designation,
      department: profile?.department || prev.department,
    }));
    setCheckingProfile(false);
  }, [isLoadingAuth, isAuthenticated, user, profile, metaRole, navigate]);

  const updateField = (key, value) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === "district") {
        updated.mandal = "";
        updated.station = "";
      }
      if (key === "mandal") updated.station = "";
      return updated;
    });
  };

  const mandals = form.district ? PILOT_DATA[form.district]?.mandals || [] : [];
  const stations =
    form.district && form.mandal
      ? PILOT_DATA[form.district]?.stations?.[form.mandal] || []
      : [];
  const designations = DESIGNATION_MAP[form.role] || [];
  const needsPoliceFields = isPoliceRole(form.role);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("You must be logged in");
      navigate("/login");
      return;
    }
    if (!form.phone) {
      toast.error("Phone number is required");
      return;
    }
    if (!form.district) {
      toast.error("District is required");
      return;
    }
    if (needsPoliceFields && (!form.mandal || !form.station)) {
      toast.error("Please select mandal and police station");
      return;
    }

    setLoading(true);

    const row = {
      id: user.id,
      email: user.email,
      role: form.role,
      phone: form.phone,
      district: form.district,
      mandal: needsPoliceFields ? form.mandal : null,
      police_station: needsPoliceFields ? form.station : null,
      designation: form.designation || null,
      department: needsPoliceFields ? form.department : null,
      profile_completed: true,
      updated_at: new Date().toISOString(),
    };

    // Use centralized API to save profile and role-specific extension rows
    const { error } = await saveCompleteProfile(user.id, user.email, form);
    setLoading(false);

    if (error) {
      console.error(error);
      toast.error(error.message || "Failed to save profile");
      return;
    }

    await refreshProfile();
    toast.success("Profile saved successfully!");
    navigate(getDashboardPath(form.role), { replace: true });
  };

  const districtLabel = (d) => {
    if (d === "Krishna") return "Vijayawada (Krishna)";
    if (d === "Chittoor") return "Tirupati (Chittoor)";
    return d;
  };

  if (checkingProfile || isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <Link
        to="/login"
        className="fixed top-20 left-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg px-3 py-2 shadow-sm transition z-40"
      >
        ← Back
      </Link>
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="font-heading">{t("completeProfile")}</CardTitle>
          <p className="text-xs text-muted-foreground">
            Role:{" "}
            <span className="font-semibold capitalize">{form.role.replace(/_/g, " ")}</span>
            {form.district && ` • ${districtLabel(form.district)}`}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t("phone")} *</Label>
            <Input
              placeholder="+91 XXXXX XXXXX"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>

          <div>
            <Label>
              {t("district")} *{" "}
              <span className="text-xs text-muted-foreground">(5 Pilot Districts)</span>
            </Label>
            <Select value={form.district} onValueChange={(v) => updateField("district", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                {PILOT_DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {districtLabel(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsPoliceFields && (
            <>
              <div>
                <Label>Mandal / Area *</Label>
                <Select
                  value={form.mandal}
                  onValueChange={(v) => updateField("mandal", v)}
                  disabled={!form.district}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mandal" />
                  </SelectTrigger>
                  <SelectContent>
                    {mandals.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Police Station *</Label>
                <Select
                  value={form.station}
                  onValueChange={(v) => updateField("station", v)}
                  disabled={!form.mandal}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {designations.length > 0 && (
                <div>
                  <Label>{t("designation")}</Label>
                  <Select
                    value={form.designation}
                    onValueChange={(v) => updateField("designation", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      {designations.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>{t("departments")}</Label>
                <Select
                  value={form.department}
                  onValueChange={(v) => updateField("department", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["general", "narcotics", "cyber_crime", "cid", "traffic", "anti_corruption"].map(
                      (d) => (
                        <SelectItem key={d} value={d}>
                          {d.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {form.role === AUTH_ROLES.COURT_OFFICER && designations.length > 0 && (
            <div>
              <Label>Court Designation</Label>
              <Select
                value={form.designation}
                onValueChange={(v) => updateField("designation", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {designations.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={loading} className="w-full mt-4">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("submit")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
