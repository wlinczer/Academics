// Generates the fictional Doc Finder library: library.json, library.js (same data,
// so index.html works from file://), and one viewable page per document.
// Run: node GenAI/tools/build-library.js
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "doc-finder");
const CF = "Clinical Forms";
const PC = "Procedures & Compliance";

const docs = [
  {
    id: "authorization-to-disclose",
    title: "Authorization to Disclose",
    folder: CF, type: "form", version_date: "2025-03-10", status: "current", supersedes: null,
    synonyms: ["release of information", "roi", "records release", "release form", "disclosure form", "consent to release"],
    summary: "Clients sign this form to allow Northshore Family Health to share their records with a named person or outside provider. It lists what may be shared, with whom, and when the permission expires.",
  },
  {
    id: "expense-reimbursement-2019",
    title: "Expense Reimbursement Form",
    folder: PC, type: "form", version_date: "2019-07-01", status: "superseded", supersedes: null,
    synonyms: ["expense report", "reimbursement", "get paid back", "out of pocket"],
    summary: "Staff used this form to request repayment for approved work expenses. It was replaced by the 2025 version.",
  },
  {
    id: "expense-reimbursement-2025",
    title: "Expense Reimbursement Form",
    folder: PC, type: "form", version_date: "2025-01-15", status: "current", supersedes: "expense-reimbursement-2019",
    synonyms: ["expense report", "reimbursement", "get paid back", "out of pocket"],
    summary: "Staff use this form to request repayment for approved work expenses. Attach receipts and submit it to your supervisor within 30 days of the expense.",
  },
  {
    id: "consent-for-treatment-2022",
    title: "Consent for Treatment",
    folder: CF, type: "form", version_date: "2022-09-01", status: "superseded", supersedes: null,
    synonyms: ["treatment consent", "intake consent", "consent to treat", "informed consent"],
    summary: "Clients signed this form at intake to agree to behavioral health services. It was replaced by the 2025 version.",
  },
  {
    id: "consent-for-treatment-2025",
    title: "Consent for Treatment",
    folder: CF, type: "form", version_date: "2025-02-01", status: "current", supersedes: "consent-for-treatment-2022",
    synonyms: ["treatment consent", "intake consent", "consent to treat", "informed consent"],
    summary: "Clients sign this form at intake to agree to behavioral health services. It explains client rights, confidentiality limits, and how to withdraw consent.",
  },
  {
    id: "psychiatric-referral",
    title: "Psychiatric Referral Form",
    folder: CF, type: "form", version_date: "2024-11-05", status: "current", supersedes: null,
    synonyms: ["psych referral", "psychiatry referral", "medication evaluation", "med eval", "refer to psychiatrist"],
    summary: "Clinicians complete this form to refer a client for a psychiatric or medication evaluation. It records the reason for referral and current symptoms.",
  },
  {
    id: "medical-records-procedure",
    title: "Medical Records Procedure",
    folder: PC, type: "procedure", version_date: "2025-04-20", status: "current", supersedes: null,
    synonyms: ["records request", "client records request", "chart request", "copy of records", "records access"],
    summary: "Describes how staff respond when a client requests their records, including verifying identity and logging the request. Requests are completed within 30 days.",
  },
  {
    id: "records-request-procedure",
    title: "Records Request Procedure",
    folder: PC, type: "procedure", version_date: "2024-06-12", status: "current", supersedes: null,
    synonyms: ["client records request", "chart request", "copy of records", "records access"],
    summary: "Describes how front desk staff route a client's request for their records to the records team. Staff confirm the client's identity before routing.",
  },
  {
    id: "incident-report",
    title: "Incident Report Form",
    folder: CF, type: "form", version_date: "2025-05-02", status: "current", supersedes: null,
    synonyms: ["incident", "critical incident", "report an incident", "accident report", "event report"],
    summary: "Staff complete this form after any safety incident involving a client, visitor, or staff member. It is submitted to the program director within 24 hours.",
  },
  {
    id: "supervision-log",
    title: "Clinical Supervision Log",
    folder: CF, type: "form", version_date: "2024-08-19", status: "current", supersedes: null,
    synonyms: ["supervision hours", "supervision notes", "licensure hours", "supervision form"],
    summary: "Clinicians record the date, length, and topics of each clinical supervision session. Supervisors sign each entry.",
  },
  {
    id: "pto-request",
    title: "PTO Request Form",
    folder: PC, type: "form", version_date: "2025-01-06", status: "current", supersedes: null,
    synonyms: ["paid time off", "time off", "vacation request", "day off", "vacation"],
    summary: "Staff use this form to request paid time off. Submit it to your supervisor at least two weeks before the requested dates.",
  },
  {
    id: "mileage-log",
    title: "Mileage Log",
    folder: PC, type: "form", version_date: "2024-10-01", status: "current", supersedes: null,
    synonyms: ["mileage reimbursement", "miles", "driving log", "travel log", "home visit mileage"],
    summary: "Staff record work-related miles driven, such as home visits, for monthly mileage reimbursement. Each trip lists date, start, destination, and miles.",
  },
  {
    id: "crisis-safety-plan",
    title: "Crisis Safety Plan Template",
    folder: CF, type: "template", version_date: "2025-03-28", status: "current", supersedes: null,
    synonyms: ["safety plan", "suicide safety plan", "crisis plan", "safety planning"],
    summary: "Clinicians complete this template with a client to list warning signs, coping steps, and people and crisis lines to contact. A copy is given to the client.",
  },
  {
    id: "treatment-plan",
    title: "Individualized Treatment Plan",
    folder: CF, type: "form", version_date: "2024-12-09", status: "current", supersedes: null,
    synonyms: ["treatment plan", "itp", "care plan", "service plan", "goals"],
    summary: "Clinicians use this form to record a client's treatment goals, objectives, and planned services. It is reviewed with the client every 90 days.",
  },
  {
    id: "hipaa-privacy-policy",
    title: "HIPAA Privacy Policy",
    folder: PC, type: "policy", version_date: "2025-02-14", status: "current", supersedes: null,
    synonyms: ["privacy", "confidentiality", "hipaa", "phi", "protected health information"],
    summary: "Explains how staff protect client health information and when it may be shared. It applies to all staff and volunteers.",
  },
  {
    id: "mandated-reporting",
    title: "Mandated Reporting Procedure",
    folder: PC, type: "procedure", version_date: "2024-09-30", status: "current", supersedes: null,
    synonyms: ["mandated reporter", "child abuse report", "dcf report", "51a", "abuse reporting"],
    summary: "Describes the steps staff take when they suspect abuse or neglect, including who to notify. Staff inform their supervisor the same day.",
  },
  {
    id: "documentation-timeliness",
    title: "Clinical Documentation Timeliness Policy",
    folder: PC, type: "policy", version_date: "2025-06-03", status: "current", supersedes: null,
    synonyms: ["progress note deadline", "note deadline", "late notes", "documentation deadline", "progress notes"],
    summary: "Sets the deadline for completing progress notes after each client session. Notes are due within 48 hours.",
  },
  {
    id: "discharge-summary",
    title: "Discharge Summary Form",
    folder: CF, type: "form", version_date: "2024-07-22", status: "current", supersedes: null,
    synonyms: ["discharge", "closing a case", "case closure", "termination of services", "close out client"],
    summary: "Clinicians complete this form when a client ends services. It summarizes treatment progress and any referrals made.",
  },
];

docs.forEach((d) => (d.link = `library/${d.id}.html`));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

fs.mkdirSync(path.join(OUT, "library"), { recursive: true });
fs.writeFileSync(path.join(OUT, "library.json"), JSON.stringify(docs, null, 2) + "\n");
fs.writeFileSync(
  path.join(OUT, "library.js"),
  "// Generated from library.json by GenAI/tools/build-library.js. Lets index.html work from file://.\n" +
    "window.LIBRARY = " + JSON.stringify(docs, null, 2) + ";\n"
);

for (const d of docs) {
  const newer = docs.find((x) => x.supersedes === d.id);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(d.title)} (${d.version_date})</title>
<link rel="stylesheet" href="../style.css">
</head>
<body>
<main>
<p class="banner">Fictional sample document. Northshore Family Health is not a real organization.</p>
<h1>${esc(d.title)}</h1>
<dl class="meta">
<dt>Folder</dt><dd>${esc(d.folder)}</dd>
<dt>Version date</dt><dd>${d.version_date}</dd>
<dt>Status</dt><dd class="status-${d.status}">${d.status}</dd>
</dl>
${newer ? `<p class="note">A newer version exists: <a href="${newer.id}.html">${esc(newer.title)} (${newer.version_date})</a>.</p>\n` : ""}<h2>Summary</h2>
<p>${esc(d.summary)}</p>
<p><a href="../index.html">Back to Siftr</a></p>
</main>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, "library", `${d.id}.html`), html);
}
console.log(`Wrote ${docs.length} documents.`);
