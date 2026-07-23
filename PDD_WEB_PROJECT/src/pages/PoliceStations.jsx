import { useState } from "react";
import { MapPin, Phone, Search, ChevronRight, Building2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const policeData = {
  "Visakhapatnam": {
    circles: {
      "Visakhapatnam City": {
        mandals: {
          "Gajuwaka": ["Gajuwaka PS — Gajuwaka Main Road | 0891-2541100", "Bheemunipatnam PS — Beach Road, Bheemunipatnam | 08933-222100"],
          "Seethammadhara": ["One Town PS — Chittivalasa Rd | 0891-2888100", "MVP Colony PS — MVP Colony Sector-8 | 0891-2795100"],
          "Anakapalli": ["Anakapalli Town PS — Main Road, Anakapalli | 08924-222100", "Chodavaram PS — Chodavaram | 08926-232100"],
        }
      },
      "Visakhapatnam Rural": {
        mandals: {
          "Araku": ["Araku Valley PS — Araku | 08936-245100", "Paderu PS — Paderu | 08936-220222"],
        }
      }
    }
  },
  "Guntur": {
    circles: {
      "Guntur City": {
        mandals: {
          "Guntur Urban": ["Guntur Town PS — Arundelpet | 0863-2228500", "Guntur II Town PS — Brodipet | 0863-2224100", "Narasaraopet PS — Main Road | 08647-222100"],
          "Tenali": ["Tenali Town PS — Gandhi Nagar | 08644-222100", "Repalle PS — Repalle | 08648-222100"],
        }
      },
      "Mangalagiri": {
        mandals: {
          "Mangalagiri": ["Mangalagiri PS — NH-16, Mangalagiri | 0863-2476100", "Tadepalle PS — Tadepalle | 0863-2222100"],
        }
      }
    }
  },
  "Krishna": {
    circles: {
      "Vijayawada City": {
        mandals: {
          "Vijayawada": ["Vijayawada One Town PS — MG Road | 0866-2577100", "Vijayawada II Town PS — Governorpet | 0866-2431100", "Bhavanipuram PS — Bhavanipuram | 0866-2513100"],
          "Machilipatnam": ["Machilipatnam Town PS — Gandhi Nagar | 08672-222100", "Gudivada PS — Main Road, Gudivada | 08674-222100"],
        }
      }
    }
  },
  "East Godavari": {
    circles: {
      "Kakinada": {
        mandals: {
          "Kakinada Urban": ["Kakinada Town PS — Main Road | 0884-2362100", "Kakinada Rural PS — Bypass Road | 0884-2384100"],
          "Rajahmundry": ["Rajahmundry Town PS — MG Road | 0883-2472100", "Dowleswaram PS — Dowleswaram | 0883-2453100"],
        }
      },
      "Amalapuram": {
        mandals: {
          "Amalapuram": ["Amalapuram Town PS — Main Road | 08856-222100", "Ramachandrapuram PS — Ramachandrapuram | 08855-222100"],
        }
      }
    }
  },
  "West Godavari": {
    circles: {
      "Eluru": {
        mandals: {
          "Eluru Urban": ["Eluru Town PS — Main Road | 08812-222100", "Eluru Rural PS — Bypass | 08812-224100"],
          "Bhimavaram": ["Bhimavaram Town PS — Kothapet | 08816-222100", "Tanuku PS — Tanuku | 08819-222100"],
        }
      },
      "Narsapuram": {
        mandals: {
          "Narsapuram": ["Narsapuram Town PS — Gandhi Nagar | 08814-222100", "Palakol PS — Main Road, Palakol | 08818-222100"],
        }
      }
    }
  },
  "Kurnool": {
    circles: {
      "Kurnool City": {
        mandals: {
          "Kurnool Urban": ["Kurnool Town PS — NH-44 | 08518-222100", "Kurnool II Town PS — Station Road | 08518-224100"],
          "Nandyal": ["Nandyal Town PS — Main Road | 08514-222100", "Allagadda PS — Allagadda | 08519-222100"],
        }
      },
      "Adoni": {
        mandals: {
          "Adoni": ["Adoni Town PS — Main Road | 08512-222100", "Mantralayam PS — Mantralayam | 08514-238100"],
        }
      }
    }
  },
  "Chittoor": {
    circles: {
      "Tirupati": {
        mandals: {
          "Tirupati Urban": ["Tirupati Town PS — Gandhi Road | 0877-2222100", "Tirupati Rural PS — Bypass | 0877-2251100", "Srikalahasti PS — Main Road | 08578-222100"],
          "Chittoor": ["Chittoor Town PS — Station Road | 08572-222100", "Puttur PS — Main Road, Puttur | 08577-222100"],
        }
      },
      "Madanapalle": {
        mandals: {
          "Madanapalle": ["Madanapalle Town PS — Main Road | 08571-222100", "Punganur PS — Punganur | 08575-222100"],
        }
      }
    }
  },
  "YSR Kadapa": {
    circles: {
      "Kadapa City": {
        mandals: {
          "Kadapa Urban": ["Kadapa Town PS — Gandhinagar | 08562-222100", "Kadapa II Town PS — Nehru Nagar | 08562-224100"],
          "Proddatur": ["Proddatur Town PS — Main Road | 08564-222100", "Rajampet PS — Main Road | 08565-222100"],
        }
      }
    }
  },
  "Anantapur": {
    circles: {
      "Anantapur City": {
        mandals: {
          "Anantapur Urban": ["Anantapur Town PS — Main Road | 08554-222100", "Guntakal Town PS — Railway Colony | 08552-222100"],
          "Dharmavaram": ["Dharmavaram Town PS — Main Road | 08557-222100", "Tadipatri PS — Main Road | 08558-222100"],
        }
      },
      "Hindupur": {
        mandals: {
          "Hindupur": ["Hindupur Town PS — Station Road | 08556-222100", "Penukonda PS — Main Road | 08555-222100"],
        }
      }
    }
  },
  "Nellore": {
    circles: {
      "Nellore City": {
        mandals: {
          "Nellore Urban": ["Nellore Town PS — Trunk Road | 0861-2325100", "Nellore II Town PS — Grand Trunk Road | 0861-2302100"],
          "Kavali": ["Kavali Town PS — Main Road | 08626-222100", "Gudur PS — Station Road | 08624-222100"],
        }
      },
      "Sullurpeta": {
        mandals: {
          "Sullurpeta": ["Sullurpeta PS — Main Road | 08623-222100", "Naidupeta PS — Main Road | 08621-222100"],
        }
      }
    }
  },
  "Prakasam": {
    circles: {
      "Ongole": {
        mandals: {
          "Ongole Urban": ["Ongole Town PS — Gandhi Nagar | 08592-222100", "Ongole Rural PS — Bypass | 08592-224100"],
          "Markapur": ["Markapur Town PS — Main Road | 08596-222100", "Giddalur PS — Main Road | 08598-222100"],
        }
      }
    }
  },
  "Srikakulam": {
    circles: {
      "Srikakulam": {
        mandals: {
          "Srikakulam Urban": ["Srikakulam Town PS — Main Road | 08942-222100", "Amadalavalasa PS — Main Road | 08941-222100"],
          "Palakonda": ["Palakonda PS — Main Road | 08947-222100", "Tekkali PS — Tekkali | 08945-222100"],
        }
      }
    }
  },
  "Vizianagaram": {
    circles: {
      "Vizianagaram": {
        mandals: {
          "Vizianagaram Urban": ["Vizianagaram Town PS — Main Road | 08922-222100", "Bobbili PS — Station Road | 08941-232100"],
          "Parvathipuram": ["Parvathipuram PS — Main Road | 08947-252100", "Salur PS — Salur | 08966-222100"],
        }
      }
    }
  },
};

export default function PoliceStations() {
  const navigate = useNavigate();
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [selectedMandal, setSelectedMandal] = useState(null);
  const [search, setSearch] = useState("");

  const districts = Object.keys(policeData).sort();

  const getCircles = () => selectedDistrict ? Object.keys(policeData[selectedDistrict].circles) : [];
  const getMandals = () => selectedDistrict && selectedCircle ? Object.keys(policeData[selectedDistrict].circles[selectedCircle].mandals) : [];
  const getStations = () => {
    if (selectedDistrict && selectedCircle && selectedMandal) {
      return policeData[selectedDistrict].circles[selectedCircle].mandals[selectedMandal];
    }
    return [];
  };

  // Search across all stations
  const searchResults = search.length > 2
    ? Object.entries(policeData).flatMap(([dist, dv]) =>
        Object.entries(dv.circles).flatMap(([circle, cv]) =>
          Object.entries(cv.mandals).flatMap(([mandal, stations]) =>
            stations.filter(s => s.toLowerCase().includes(search.toLowerCase())).map(s => ({
              station: s, dist, circle, mandal
            }))
          )
        )
      )
    : [];

  const resetFrom = (level) => {
    if (level === "district") { setSelectedDistrict(null); setSelectedCircle(null); setSelectedMandal(null); }
    if (level === "circle") { setSelectedCircle(null); setSelectedMandal(null); }
    if (level === "mandal") { setSelectedMandal(null); }
  };

  const breadcrumb = [
    selectedDistrict && { label: selectedDistrict, onClick: () => resetFrom("circle") },
    selectedCircle && { label: selectedCircle, onClick: () => resetFrom("mandal") },
    selectedMandal && { label: selectedMandal },
  ].filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          AP Police Stations Directory
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Find police stations across Andhra Pradesh — District → Circle → Mandal
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search police station name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Search Results */}
      {search.length > 2 && (
        <div className="mb-6 space-y-2">
          {searchResults.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No stations found matching "{search}"</p>
          ) : searchResults.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{r.station.split("|")[0].trim()}</p>
                  <p className="text-xs text-muted-foreground">{r.station.split("|")[1]?.trim()}</p>
                  <p className="text-xs text-primary mt-1">{r.dist} → {r.circle} → {r.mandal}</p>
                </div>
                <a href={`tel:${r.station.match(/[\d-]{8,}/)?.[0]}`} className="ml-auto">
                  <Phone className="w-4 h-4 text-secondary" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!search && (
        <>
          {/* Breadcrumb */}
          {breadcrumb.length > 0 && (
            <div className="flex items-center gap-1 mb-4 text-xs text-muted-foreground flex-wrap">
              <button onClick={() => resetFrom("district")} className="hover:text-primary transition">All Districts</button>
              {breadcrumb.map((b, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" />
                  {b.onClick ? (
                    <button onClick={b.onClick} className="hover:text-primary transition">{b.label}</button>
                  ) : (
                    <span className="text-foreground font-medium">{b.label}</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* District Selection */}
          {!selectedDistrict && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {districts.map((d, i) => (
                <motion.button key={d} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedDistrict(d)}
                  className="bg-card rounded-xl border border-border p-4 text-left hover:border-primary hover:shadow-sm transition group">
                  <Building2 className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition" />
                  <p className="font-medium text-sm text-foreground">{d}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {Object.keys(policeData[d].circles).length} circles
                  </p>
                </motion.button>
              ))}
            </div>
          )}

          {/* Circle Selection */}
          {selectedDistrict && !selectedCircle && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {getCircles().map((c, i) => (
                <motion.button key={c} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedCircle(c)}
                  className="bg-card rounded-xl border border-border p-4 text-left hover:border-primary hover:shadow-sm transition flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{c}</p>
                    <p className="text-xs text-muted-foreground">
                      {Object.keys(policeData[selectedDistrict].circles[c].mandals).length} mandals
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </motion.button>
              ))}
            </div>
          )}

          {/* Mandal Selection */}
          {selectedDistrict && selectedCircle && !selectedMandal && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {getMandals().map((m, i) => (
                <motion.button key={m} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedMandal(m)}
                  className="bg-card rounded-xl border border-border p-4 text-left hover:border-primary hover:shadow-sm transition flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{m}</p>
                    <p className="text-xs text-muted-foreground">
                      {policeData[selectedDistrict].circles[selectedCircle].mandals[m].length} stations
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </motion.button>
              ))}
            </div>
          )}

          {/* Police Stations */}
          {selectedMandal && (
            <div className="space-y-3">
              {getStations().map((s, i) => {
                const [name, rest] = s.split("—");
                const [address, phone] = rest?.split("|") || [];
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-xl border border-border p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">{name?.trim()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{address?.trim()}
                      </p>
                      {phone && (
                        <a href={`tel:${phone.trim()}`} className="text-xs text-secondary flex items-center gap-1 mt-1 hover:underline">
                          <Phone className="w-3 h-3" />{phone.trim()}
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}