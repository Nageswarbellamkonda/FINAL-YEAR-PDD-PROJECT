/**
 * NYAYA MITRA — Role-Based Access Control (RBAC) System
 * Defines roles, hierarchy, permissions, and jurisdiction filtering.
 */

export const ROLES = {
  DGP:        "dgp",
  ADG:        "adg",
  IG:         "ig",
  DIG:        "dig",
  SP:         "sp",
  DSP:        "dsp",
  CI:         "ci",
  SI:         "si",
  CONSTABLE:  "police",
  SHE_TEAMS:  "she_teams",
  SPECIAL:    "special",
  LAWYER:     "lawyer",
  COURT:      "court",
  CITIZEN:    "citizen",
  ADMIN:      "admin",
};

export const ROLE_LABELS = {
  dgp:       "Director General of Police (DGP)",
  adg:       "Additional DG (ADG)",
  ig:        "Inspector General (IG)",
  dig:       "Deputy IG (DIG)",
  sp:        "Superintendent of Police (SP)",
  dsp:       "Deputy SP (DSP)",
  ci:        "Circle Inspector (CI)",
  si:        "Sub-Inspector (SI)",
  police:    "Constable",
  she_teams: "SHE Teams Officer",
  special:   "Special Officer",
  lawyer:    "Lawyer",
  court:     "Court Official",
  citizen:   "Citizen",
  admin:     "System Admin",
  user:      "Citizen",
};

export const ROLE_RANK = {
  admin:     100,
  dgp:       90,
  adg:       85,
  ig:        80,
  dig:       75,
  sp:        70,
  dsp:       65,
  ci:        50,
  si:        40,
  she_teams: 35,
  special:   35,
  police:    30,
  lawyer:    20,
  court:     20,
  citizen:   10,
  user:      10,
};

export const PERMISSIONS = {
  VIEW_ALL_DISTRICTS:       ["admin", "dgp", "adg", "ig", "dig"],
  VIEW_DISTRICT:            ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp"],
  VIEW_CIRCLE:              ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp", "ci"],
  VIEW_STATION:             ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp", "ci", "si", "police", "she_teams", "special"],
  UPDATE_ANY_CASE:          ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp"],
  UPDATE_DISTRICT_CASE:     ["sp", "dsp", "ci"],
  UPDATE_STATION_CASE:      ["ci", "si", "police", "she_teams", "special"],
  TRANSFER_CASE:            ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp", "ci"],
  DELETE_CASE:              ["admin", "dgp"],
  ESCALATE_CASE:            ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp", "ci", "si"],
  PUBLISH_DISTRICT_ALERT:   ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp"],
  PUBLISH_STATION_ALERT:    ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp", "ci", "si"],
  ASSIGN_DUTY:              ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp", "ci", "si"],
  VIEW_DUTIES:              ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp", "ci", "si", "police", "she_teams", "special"],
  VIEW_ALL_ATTENDANCE:      ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp"],
  MANAGE_ATTENDANCE:        ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp", "ci", "si"],
  VIEW_PERFORMANCE:         ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp"],
  VIEW_OWN_PERFORMANCE:     ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp", "ci", "si", "police"],
  STATION_ADMIN:            ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp", "ci", "si"],
  OFFICER_DASHBOARD:        ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp", "ci", "si", "police", "she_teams", "special"],
  ANALYTICS:                ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp", "ci"],
  AI_ADVISOR:               ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp", "ci", "si"],
  CASE_MANAGEMENT:          ["admin", "dgp", "adg", "ig", "dig", "sp", "dsp", "ci", "si"],
};

export function hasPermission(userRole, permission) {
  const allowed = PERMISSIONS[permission] || [];
  return allowed.includes(userRole?.toLowerCase());
}

export function getJurisdiction(userRole) {
  const r = userRole?.toLowerCase();
  if (["admin", "dgp", "adg", "ig", "dig"].includes(r)) return "all";
  if (["sp", "dsp"].includes(r)) return "district";
  if (["ci"].includes(r)) return "circle";
  return "station";
}

export function filterComplaintsByRole(complaints, user) {
  const role = user?.user_type || user?.role || "citizen";
  const jurisdiction = getJurisdiction(role);
  if (jurisdiction === "all") return complaints;
  if (jurisdiction === "district") {
    return complaints.filter(c => !user.district || c.district === user.district || c.location?.toLowerCase().includes((user.district || "").toLowerCase()));
  }
  if (jurisdiction === "circle") {
    return complaints.filter(c => c.district === user.district && (!user.station || c.assigned_officer === user.email || c.assigned_department === user.department));
  }
  return complaints.filter(c => c.assigned_officer === user.email || (c.district === user.district && c.status !== "closed"));
}

export function getDashboardRoute(userRole) {
  const r = userRole?.toLowerCase();
  if (r === "citizen") return "/citizen-dashboard";
  if (r === "police_officer" || r === "police") return "/officer-dashboard";
  if (r === "station_officer" || r === "si" || r === "ci") return "/station-dashboard";
  if (r === "dsp") return "/dsp-dashboard";
  if (r === "lawyer") return "/lawyer-dashboard";
  if (r === "court_officer" || r === "court") return "/court-dashboard";
  if (r === "administrator" || r === "admin") return "/admin-panel";
  if (["dgp", "adg", "ig", "dig", "sp", "she_teams", "special"].includes(r)) return "/officer-dashboard";
  return "/citizen-dashboard";
}

export function isOfficerRole(userRole) {
  const officerRoles = ["police", "si", "ci", "dsp", "sp", "dig", "ig", "adg", "dgp", "she_teams", "special"];
  return officerRoles.includes(userRole?.toLowerCase());
}

export function getRoleRank(userRole) {
  return ROLE_RANK[userRole?.toLowerCase()] || 0;
}

export function outranks(roleA, roleB) {
  return getRoleRank(roleA) > getRoleRank(roleB);
}
