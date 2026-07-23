import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileText, Download, Scale, Search, Plus, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import moment from "moment";

const docTypes = [
  { value: "fir_summary", label: "FIR Summary Report", icon: "📋" },
  { value: "chargesheet", label: "Charge Sheet Draft", icon: "⚖️" },
  { value: "court_petition", label: "Court Petition", icon: "🏛️" },
  { value: "witness_statement", label: "Witness Statement", icon: "👤" },
  { value: "bail_application", label: "Bail Application", icon: "🔓" },
  { value: "case_closure", label: "Case Closure Report", icon: "✅" },
  { value: "escalation_notice", label: "Escalation Notice", icon: "⚠️" },
  { value: "legal_notice", label: "Legal Notice to Accused", icon: "📜" },
];

function generateTemplate(docType, complaint) {
  const date = moment().format("DD MMMM YYYY");
  const filedDate = moment(complaint.created_at || complaint.created_date).format("DD MMMM YYYY");
  const cid = complaint.complaint_number || complaint.case_id || complaint.id?.slice(0, 12).toUpperCase();
  const location = `${complaint.location}${complaint.district ? ", " + complaint.district : ""}, Andhra Pradesh`;
  const dept = (complaint.assigned_department || "general").replace(/_/g, " ").toUpperCase();
  const category = (complaint.category || "other").replace(/_/g, " ").toUpperCase();

  const templates = {
    fir_summary: `
ANDHRA PRADESH POLICE
FIRST INFORMATION REPORT — SUMMARY DOCUMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CASE REFERENCE NUMBER    : ${cid}
DATE OF FILING           : ${filedDate}
DATE OF THIS DOCUMENT    : ${date}
NATURE OF OFFENCE        : ${category}
PRIORITY CLASSIFICATION  : ${(complaint.priority || "normal").toUpperCase()}
CURRENT CASE STATUS      : ${(complaint.status || "filed").replace(/_/g, " ").toUpperCase()}

COMPLAINANT INFORMATION
━━━━━━━━━━━━━━━━━━━
Name          : ${complaint.complainant_name}
Contact No.   : ${complaint.complainant_phone}
Email         : ${complaint.complainant_email || "Not provided"}

INCIDENT DETAILS
━━━━━━━━━━━━━━━
Location of Incident  : ${location}
Brief Description     :

${complaint.description}

DEPARTMENT ASSIGNED     : ${dept}
ASSIGNED OFFICER        : ${complaint.assigned_officer || "Pending Assignment"}

ACTION HISTORY
━━━━━━━━━━━━━
${complaint.action_updates?.length
  ? complaint.action_updates.map(u => `[${moment(u.date).format("DD-MM-YYYY HH:mm")}] ${u.update} — by ${u.by}`).join("\n")
  : "No action updates recorded as of this date."}

PREPARED BY             : AP Police Digital Platform
DATE OF DOCUMENT        : ${date}
PLATFORM                : NYAYA MITRA — AP Police Smart Policing System

NOTE: This is a digitally generated FIR summary for official reference. The original FIR registered at the concerned police station holds legal primacy.
`,

    chargesheet: `
ANDHRA PRADESH POLICE
CHARGE SHEET DRAFT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IN THE COURT OF THE HONOURABLE JUDICIAL MAGISTRATE
CASE FILE REFERENCE   : ${cid}
DATE OF CHARGE SHEET  : ${date}

1. PARTIES TO THE CASE

   1.1 Complainant  : ${complaint.complainant_name}, Contact: ${complaint.complainant_phone}
   1.2 Accused      : Under investigation — name to be confirmed upon arrest/identification
   1.3 Investigating
       Authority    : ${dept} Department, Andhra Pradesh Police

2. NATURE OF OFFENCE

   The offence constitutes an act of ${category} committed at ${location} on or around ${filedDate}.

3. SUMMARY OF FACTS

${complaint.description}

4. APPLICABLE LEGAL SECTIONS

   As per Bharatiya Nyaya Sanhita (BNS) 2023 and relevant statutes:
   - Section(s) applicable to ${category} under the BNS 2023
   - Bharatiya Nagarik Suraksha Sanhita (BNSS) procedures followed for investigation
   - Bharatiya Sakshya Adhiniyam (BSA) evidentiary standards applied

5. EVIDENCE COLLECTED

   Digital evidence, witness statements, CCTV footage, and case-related documentation as collected by the investigating officer. Full evidence list to be attached as annexures.

6. PRAYER

   It is respectfully prayed before this Honourable Court to take cognizance of the offence committed and proceed under applicable laws in the interest of justice.

SIGNATURE BLOCK

Investigating Officer: ____________________
Rank & ID           : ${dept} — AP Police
Date                : ${date}
Station Seal        : [OFFICIAL SEAL]
`,

    court_petition: `
IN THE HONOURABLE COURT OF JUDICIAL FIRST CLASS MAGISTRATE
${(complaint.district || "ANDHRA PRADESH").toUpperCase()}

PETITION UNDER BNSS 2023

CASE REFERENCE  : ${cid}
DATE            : ${date}

PETITIONER      : ${complaint.complainant_name}
                  Contact: ${complaint.complainant_phone}
                  ${location}

RESPONDENT      : To be identified and named upon investigation

PRAYER AND STATEMENT OF FACTS

1. The petitioner humbly submits that they are a law-abiding citizen and an aggrieved party in the above matter.

2. On or around ${filedDate}, the petitioner suffered the following offence: ${category} at ${location}.

3. Details of the incident as sworn by the petitioner:
${complaint.description}

4. The petitioner has duly registered the complaint through the official AP Police digital platform (NYAYA MITRA) under Case ID ${cid} and seeks urgent judicial intervention.

5. The petitioner respectfully prays that this Honourable Court:
   a) Take cognizance of the offence on record.
   b) Direct the concerned police station to file a final charge sheet at the earliest.
   c) Grant such other relief as the court deems fit in the interest of justice.

VERIFICATION: I, ${complaint.complainant_name}, do hereby verify that the contents of this petition are true and correct to the best of my knowledge and belief.

Date            : ${date}
Place           : ${location}

Petitioner's Signature: ____________________
${complaint.complainant_name}

[Advocate's Seal & Signature if applicable]
`,

    bail_application: `
IN THE HONOURABLE COURT OF JUDICIAL MAGISTRATE
${(complaint.district || "ANDHRA PRADESH").toUpperCase()}

BAIL APPLICATION UNDER BNSS 2023

CASE REFERENCE  : ${cid}
DATE            : ${date}

IN THE MATTER OF:
Complainant     : ${complaint.complainant_name}
Case Type       : ${category}
Filed On        : ${filedDate}
Location        : ${location}

APPLICATION FOR ANTICIPATORY / REGULAR BAIL

The applicant/accused/complainant in the above matter respectfully submits this application for bail under the provisions of the Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023.

GROUNDS FOR BAIL:

1. The applicant has no prior criminal record and poses no flight risk.
2. Investigation is substantially complete and continued detention serves no purpose.
3. The applicant is willing to cooperate with the investigation and appear before this court whenever directed.
4. Continued custody will cause undue hardship.
5. The offence, being ${category}, does not fall under the category of non-bailable offences (subject to court's determination).

CONDITIONS OFFERED:

The applicant undertakes to:
a) Not tamper with evidence or influence witnesses.
b) Report to the police station as directed.
c) Surrender the passport/travel documents if directed by the court.
d) Abide by all conditions imposed by this Honourable Court.

PRAYER

It is therefore humbly prayed that this Honourable Court be pleased to grant bail to the applicant in the interest of justice and liberty guaranteed under the Constitution of India.

Date: ${date}
Applicant/Advocate Signature: ____________________
`,

    case_closure: `
ANDHRA PRADESH POLICE
CASE CLOSURE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CASE ID             : ${cid}
CLOSURE DATE        : ${date}
NATURE OF OFFENCE   : ${category}
COMPLAINANT         : ${complaint.complainant_name} (${complaint.complainant_phone})
LOCATION            : ${location}
FILED ON            : ${filedDate}

1. SUMMARY OF INVESTIGATION
   This case pertaining to ${category} was registered on ${filedDate}. The matter was investigated by the ${dept} Department under the supervision of the assigned officer.

2. ACTIONS TAKEN
${complaint.action_updates?.length
  ? complaint.action_updates.map((u, i) => `   ${i + 1}. [${moment(u.date).format("DD-MM-YYYY")}] ${u.update}`).join("\n")
  : "   1. Complaint registered and assigned to investigating officer.\n   2. Field investigation conducted.\n   3. Evidence collected and documented."}

3. OUTCOME
   The investigation has reached its conclusion. The case is hereby recommended for closure in accordance with the applicable provisions of the BNSS 2023.

4. RECOMMENDATION
   Based on the evidence gathered and actions taken, this case is recommended for:
   [ ] Charge Sheet filed before court
   [ ] Closure for lack of evidence
   [X] Resolved and settled — as per current status (${(complaint.status || "closed").replace(/_/g, " ")})

PREPARED BY           : ${dept} Department, AP Police
DATE                  : ${date}
Station/Seal          : [OFFICIAL SEAL]
`,

    witness_statement: `
ANDHRA PRADESH POLICE
WITNESS STATEMENT FORM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CASE REFERENCE    : ${cid}
DATE OF STATEMENT : ${date}
OFFENCE TYPE      : ${category}
LOCATION          : ${location}

WITNESS DETAILS

Full Name         : ____________________________________
Age / Gender      : ____________________________________
Address           : ____________________________________
Contact Number    : ____________________________________
Relationship to Case : ________________________________

STATEMENT ON OATH

I, _________________________ , do hereby make the following statement voluntarily and without coercion, in connection with Case ID ${cid} involving ${category} at ${location} on ${filedDate}:

[Witness Statement]
________________________________________________________________________________
________________________________________________________________________________
________________________________________________________________________________
________________________________________________________________________________
________________________________________________________________________________
________________________________________________________________________________

I confirm that this statement is true and correct to the best of my knowledge. I am aware that giving false evidence is punishable under law.

Witness Signature     : ____________________
Date                  : ${date}
Place                 : ${location}

Recording Officer     : ____________________
Rank & Designation    : ${dept}, AP Police
`,

    escalation_notice: `
ANDHRA PRADESH POLICE
ESCALATION NOTICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TO               : District Superintendent of Police
                   ${complaint.district || "Andhra Pradesh"}

FROM             : Investigating Officer
                   ${dept} Department

SUBJECT          : URGENT ESCALATION — Case ID ${cid}

DATE             : ${date}

1. CASE DETAILS
   Reference No.  : ${cid}
   Nature         : ${category}
   Filed By       : ${complaint.complainant_name}
   Location       : ${location}
   Filed On       : ${filedDate}

2. REASON FOR ESCALATION
   The above-referenced case requires immediate higher-level attention due to:
   a) Priority Classification: ${(complaint.priority || "high").toUpperCase()}
   b) Case Status: ${(complaint.status || "escalated").replace(/_/g, " ").toUpperCase()}
   c) Urgency: The case involves matters that require direct SP-level oversight and intervention.

3. ACTIONS TAKEN SO FAR
${complaint.action_updates?.length
  ? complaint.action_updates.map((u, i) => `   ${i + 1}. ${u.update} [${moment(u.date).format("DD-MM-YYYY")}]`).join("\n")
  : "   1. Initial investigation conducted.\n   2. Evidence documented."}

4. REQUESTED ACTION
   It is respectfully requested that the SP/DSP office:
   a) Review this case urgently.
   b) Issue directives to the investigating team.
   c) Ensure expedited justice to the complainant.

Escalated By    : ____________________
Rank & Badge    : ${dept}, AP Police
Date            : ${date}
`,

    legal_notice: `
LEGAL NOTICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATE            : ${date}
CASE ID         : ${cid}
ISSUED BY       : ${complaint.complainant_name}
                  Through: AP Police / Advocate
ISSUED TO       : The Named Accused / Respondent
                  (to be filled upon identification)

SUBJECT         : Legal Notice Under Bharatiya Nyaya Sanhita (BNS) 2023

Sir/Madam,

Under instructions from our client ${complaint.complainant_name}, we hereby serve upon you this legal notice as under:

1. That our client had filed a complaint on ${filedDate} regarding the offence of ${category} committed at ${location}, Andhra Pradesh.

2. That the said act constitutes an offence under the Bharatiya Nyaya Sanhita (BNS) 2023, attracting provisions related to ${category}.

3. That our client suffered the following harm/loss:
${complaint.description}

4. You are hereby called upon to cease and desist from any further actions that may aggravate this matter and to appear before the competent authority as directed.

5. Failing compliance within 15 (fifteen) days of receipt of this notice, our client shall be constrained to initiate appropriate legal action before the competent court without any further notice to you.

This notice is without prejudice to all other legal rights and remedies available to our client.

Issued On       : ${date}
Issuing Authority: AP Police / Legal Representative

Signature       : ____________________
Advocate/Officer: ____________________
`,
  };

  return templates[docType] || "Document template not available for this type.";
}

export default function LegalDocuments() {
  const navigate = useNavigate();
  const [caseId, setCaseId] = useState("");
  const [docType, setDocType] = useState("");
  const [complaint, setComplaint] = useState(null);
  const [searching, setSearching] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [notFound, setNotFound] = useState(false);

  const searchCase = async () => {
    if (!caseId.trim()) return;
    setSearching(true);
    setNotFound(false);
    setComplaint(null);
    setGeneratedDoc("");
    
    // Fallback removed, relying completely on Supabase
    const { data: results } = await supabase.from('complaints').select('*').or(`complaint_number.eq.${caseId.trim()},case_id.eq.${caseId.trim()},id.eq.${caseId.trim()}`);
    if (results && results.length > 0) {
      setComplaint(results[0]);
    } else {
      setNotFound(true);
      toast.error("Case not found. Check the Case ID.");
    }
    setSearching(false);
  };

  const [generating, setGenerating] = useState(false);

  const generateDocument = () => {
    if (!complaint || !docType) {
      toast.error("Please select a case and document type");
      return;
    }
    setGenerating(true);
    setGeneratedDoc("");
    
    // Simulate AI generation delay and workflow
    setTimeout(() => {
      const doc = generateTemplate(docType, complaint);
      setGeneratedDoc(doc);
      setGenerating(false);
      toast.success("AI Document generated successfully!");
    }, 1500);
  };

  const downloadDoc = () => {
    toast.info("Preparing AI document for download...");
    setTimeout(() => {
      const blob = new Blob([generatedDoc], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${complaint?.complaint_number || complaint?.case_id || "document"}_${docType}_${moment().format("YYYYMMDD")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download complete");
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl">Legal Document Generator</h1>
            <p className="text-muted-foreground text-sm">Generate structured legal documents instantly from case data</p>
          </div>
        </div>

        {/* Step 1: Search Case */}
        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
              Search Case by ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter Case ID (e.g. NM-PIL001)"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchCase()}
                className="flex-1 font-mono"
              />
              <Button onClick={searchCase} disabled={searching} className="gap-2">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </Button>
            </div>

            {notFound && <p className="text-sm text-destructive mt-2">❌ Case not found. Please verify the Case ID.</p>}

            {complaint && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-mono text-xs text-green-700 mb-1">{complaint.complaint_number || complaint.case_id}</p>
                  <p className="font-semibold">{complaint.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {complaint.complainant_name} • {complaint.location} • {moment(complaint.created_at || complaint.created_date).format("DD MMM YYYY")}
                  </p>
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-300 mt-1 inline-block">
                    {complaint.status?.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Select Doc Type */}
        {complaint && (
          <Card className="mb-5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
                Select Document Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {docTypes.map((dt) => (
                  <button
                    key={dt.value}
                    onClick={() => setDocType(dt.value)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition ${
                      docType === dt.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-xl">{dt.icon}</span>
                    <span className="text-sm font-medium">{dt.label}</span>
                  </button>
                ))}
              </div>

              <Button onClick={generateDocument} disabled={!docType || generating} className="mt-4 w-full gap-2 h-11">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {generating ? "AI is drafting your document..." : "Generate Document Instantly"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Generated Document */}
        {generatedDoc && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                    Generated Document — Ready to Download
                  </CardTitle>
                  <Button onClick={downloadDoc} size="sm" variant="outline" className="gap-2">
                    <Download className="w-4 h-4" /> Download .txt
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted rounded-lg p-4 text-xs leading-relaxed whitespace-pre-wrap overflow-auto max-h-[600px] font-mono border">
                  {generatedDoc}
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}