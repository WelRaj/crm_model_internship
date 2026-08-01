"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  FileText, Upload, CheckCircle2, X, Plus, 
  ShieldCheck, Download, Search,
  Clock, AlertTriangle
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  MetricCard, Panel, StatusBadge 
} from "../accounting/AccountingComponents";
import type { CreatedProjectRecord } from "../projects/projectHandoff";
import {
  createProjectAgreement,
  listProjectAgreements,
  listProjectHandoffs,
  type ProjectAgreementRecord,
  type ProjectHandoffRecord,
} from "@/services/leads-api";
import { canCrmAction, useCrmAccess } from "./crm-access";

// --- Validation Schema ---
const agreementSchema = z.object({
  projectId: z.string().optional(),
  clientName: z.string().min(1, "Client name is required"),
  projectName: z.string().min(1, "Project name is required"),
  agreementType: z.string().default("Master Service Agreement (MSA)"),
  effectiveDate: z.string().min(1, "Effective date required"),
  expiryDate: z.string().optional(),
  contractValue: z.preprocess(
    (value) => value === "" || value === null ? undefined : value,
    z.coerce.number().min(1, "Contract value must be greater than zero").optional(),
  ),
  paymentTerms: z.string().optional(),
  status: z.string().default("Draft"),
  remarks: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.expiryDate && data.effectiveDate && data.expiryDate < data.effectiveDate) {
    ctx.addIssue({ code: "custom", path: ["expiryDate"], message: "Expiry date cannot be earlier than effective date" });
  }
});

type AgreementFormInput = z.input<typeof agreementSchema>;
type AgreementFormData = z.output<typeof agreementSchema>;

type AgreementRecord = {
  backendId?: string;
  backendProjectHandoffId?: string | null;
  backendClientId?: string;
  id: string;
  projectId: string;
  client: string;
  project: string;
  type: string;
  date: string;
  expiryDate: string;
  value: string;
  rawValue: number;
  status: string;
  attachmentName: string;
};

function formatDateLabel(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function agreementTypeToBackend(value: string): ProjectAgreementRecord["agreement_type"] {
  if (value.includes("Statement")) return "sow";
  if (value.includes("Non-Disclosure")) return "nda";
  if (value.includes("Service Level")) return "sla";
  return "msa";
}

function agreementStatusToBackend(value: string): ProjectAgreementRecord["status"] {
  if (value === "Under Review") return "under_review";
  if (value === "Sent for Signature") return "sent_for_signature";
  if (value === "Active") return "active";
  if (value === "Expired") return "expired";
  if (value === "Terminated") return "terminated";
  return "draft";
}

function projectFromBackend(project: ProjectHandoffRecord): CreatedProjectRecord {
  return {
    id: project.id,
    clientId: project.client_detail.client_number,
    projectId: project.project_code,
    sourceLeadId: project.client_detail.source_lead_detail?.lead_number || "Manual",
    company: project.client_detail.company_name,
    projectName: project.client_detail.project_name,
    projectType: project.client_detail.project_type || "Project",
    projectOwner: project.client_detail.project_owner,
    value: Number(project.client_detail.value || 0),
    primaryContact: project.client_detail.contacts[0]?.name || "Not assigned",
    projectManager: project.project_manager,
    startDate: project.start_date,
    targetEndDate: project.target_end_date,
    priority: project.priority_label as CreatedProjectRecord["priority"],
    billingModel: project.billing_model as CreatedProjectRecord["billingModel"],
    deliveryMethod: project.delivery_method as CreatedProjectRecord["deliveryMethod"],
    communicationChannel: project.communication_channel || "Not defined",
    repositoryUrl: project.repository_url || "Not defined",
    kickoffNotes: project.kickoff_notes,
    clientContacts: project.client_detail.contacts,
    teamLeaderName: project.client_detail.team_leader,
    status: "Planning",
    createdAt: project.created_at.split("T")[0],
  };
}

function agreementFromBackend(agreement: ProjectAgreementRecord): AgreementRecord {
  return {
    backendId: agreement.id,
    backendProjectHandoffId: agreement.project_handoff,
    backendClientId: agreement.client,
    id: agreement.agreement_number,
    projectId: agreement.project_handoff_detail?.project_code || "Manual",
    client: agreement.client_detail.company_name,
    project: agreement.client_detail.project_name,
    type: agreement.agreement_type_label,
    date: formatDateLabel(agreement.effective_date),
    expiryDate: agreement.expiry_date ? formatDateLabel(agreement.expiry_date) : "Not set",
    value: agreement.contract_value ? `INR ${(Number(agreement.contract_value) / 100000).toFixed(1)}L` : "TBD",
    rawValue: Number(agreement.contract_value || 0),
    status: agreement.status_label,
    attachmentName: agreement.attachment_name || "Pending upload",
  };
}

export default function ProjectAgreement() {
  const { roleCodes } = useCrmAccess();
  const canCreateAgreement = canCrmAction(roleCodes, "create", "agreements");
  const canExportAgreement = canCrmAction(roleCodes, "export", "agreements");
  const canViewAgreement = canCrmAction(roleCodes, "view", "agreements");
  const [agreements, setAgreements] = useState<AgreementRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientEntryMode, setClientEntryMode] = useState<"existing" | "manual">("existing");
  const [projectEntryMode, setProjectEntryMode] = useState<"existing" | "manual">("existing");
  const [createdProjects, setCreatedProjects] = useState<CreatedProjectRecord[]>([]);
  const [backendProjects, setBackendProjects] = useState<ProjectHandoffRecord[]>([]);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [todayTime] = useState(() => Date.now());

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<AgreementFormInput, unknown, AgreementFormData>({
    resolver: zodResolver(agreementSchema),
    defaultValues: {
      effectiveDate: new Date().toISOString().split('T')[0],
      agreementType: "Master Service Agreement (MSA)",
      status: "Draft"
    }
  });
  const selectedProjectId = useWatch({ control, name: "projectId" });

  useEffect(() => {
    let isMounted = true;
    const loadAgreements = async () => {
      try {
        const [projectResponse, agreementResponse] = await Promise.all([listProjectHandoffs(), listProjectAgreements()]);
        if (!isMounted) return;
        setBackendProjects(projectResponse);
        setCreatedProjects(projectResponse.map(projectFromBackend));
        setAgreements(agreementResponse.map(agreementFromBackend));
        setFormError("");
      } catch (error) {
        if (isMounted) setFormError(error instanceof Error ? error.message : "Unable to load backend agreements.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    const timer = window.setTimeout(loadAgreements, 0);
    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (projectEntryMode !== "existing" || !selectedProjectId) return;

    const selectedProject = createdProjects.find((project) => project.projectId === selectedProjectId);
    if (!selectedProject) return;

    setValue("clientName", selectedProject.company, { shouldValidate: true });
    setValue("projectName", selectedProject.projectName, { shouldValidate: true });
    setValue("contractValue", selectedProject.value, { shouldValidate: true });
    setValue("effectiveDate", selectedProject.startDate, { shouldValidate: true });
    setValue("expiryDate", selectedProject.targetEndDate, { shouldValidate: true });
    setValue("paymentTerms", selectedProject.billingModel === "Milestone Based" ? "Milestone-based billing as per approved project scope." : selectedProject.billingModel);
  }, [createdProjects, projectEntryMode, selectedProjectId, setValue]);

  const projectOptions = useMemo(
    () => createdProjects.map((project) => `${project.projectId} - ${project.projectName}`),
    [createdProjects],
  );

  const combinedClientOptions = useMemo(() => Array.from(new Set(createdProjects.map((project) => project.company))), [createdProjects]);

  const onSubmit = async (data: AgreementFormData) => {
    setFormError("");
    if (!canCreateAgreement) {
      setFormError("You are not allowed to create or update agreements.");
      return;
    }
    const selectedBackendProject = backendProjects.find((project) => project.project_code === data.projectId);
    if (!selectedBackendProject) {
      setFormError("Select a backend project handoff before creating agreement.");
      return;
    }

    try {
      const savedAgreement = await createProjectAgreement({
        project_handoff_id: selectedBackendProject.id,
        client_id: selectedBackendProject.client,
        agreement_type: agreementTypeToBackend(data.agreementType),
        effective_date: data.effectiveDate,
        expiry_date: data.expiryDate || null,
        contract_value: String(data.contractValue || selectedBackendProject.client_detail.value || 0),
        payment_terms: data.paymentTerms || "",
        status: agreementStatusToBackend(data.status),
        remarks: data.remarks || "",
        attachment_name: selectedFileName,
      });
      setAgreements((current) => [agreementFromBackend(savedAgreement), ...current]);
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        setShowForm(false);
        reset();
        setSelectedFileName("");
        setFileError("");
        setClientEntryMode("existing");
        setProjectEntryMode("existing");
      }, 1200);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save agreement.");
    }
  };

  const filteredAgreements = agreements.filter((agreement) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [agreement.id, agreement.projectId, agreement.client, agreement.project, agreement.type, agreement.status, agreement.value, agreement.expiryDate]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const totalValueLabel = `INR ${(agreements.reduce((sum, agreement) => sum + agreement.rawValue, 0) / 100000).toFixed(1)}L`;
  const expiringSoonCount = agreements.filter((agreement) => {
    if (agreement.expiryDate === "Not set") return false;
    const expiryTime = new Date(agreement.expiryDate).getTime();
    const nextThirtyDays = todayTime + 30 * 24 * 60 * 60 * 1000;
    return expiryTime >= todayTime && expiryTime <= nextThirtyDays;
  }).length;

  const handleAgreementFile = (file?: File) => {
    setFileError("");
    setSelectedFileName("");
    if (!file) return;

    if (file.type !== "application/pdf") {
      setFileError("Only PDF agreement files are allowed.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setFileError("PDF file size must be 15MB or less.");
      return;
    }

    setSelectedFileName(file.name);
  };

  const handleExport = () => {
    const csvRows = [
      ["Agreement ID", "Project ID", "Client", "Project", "Type", "Effective Date", "Expiry Date", "Value", "Status", "Attachment"],
      ...filteredAgreements.map((agreement) => [
        agreement.id,
        agreement.projectId,
        agreement.client,
        agreement.project,
        agreement.type,
        agreement.date,
        agreement.expiryDate,
        agreement.value,
        agreement.status,
        agreement.attachmentName,
      ]),
    ];
    const csv = csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "project-agreements.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAgreement = (agreement: AgreementRecord) => {
    const content = [
      "Project Agreement Record",
      `Agreement ID: ${agreement.id}`,
      `Project ID: ${agreement.projectId}`,
      `Client: ${agreement.client}`,
      `Project: ${agreement.project}`,
      `Type: ${agreement.type}`,
      `Effective Date: ${agreement.date}`,
      `Expiry Date: ${agreement.expiryDate}`,
      `Value: ${agreement.value}`,
      `Status: ${agreement.status}`,
      `Attachment: ${agreement.attachmentName}`,
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${agreement.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AccountingPage
      title="Legal Agreements"
      description="Manage project contracts, Master Service Agreements (MSA), Statements of Work (SOW), and signed PDF records."
      icon={ShieldCheck}
      badge="Legal Compliance"
      actions={
        <>
          <ActionButton icon={Download} label="Export" variant="outline" onClick={handleExport} disabled={!canExportAgreement} />
          <ActionButton 
            icon={Plus} 
            label="New Agreement" 
            variant="accent" 
            onClick={() => setShowForm(true)}
            disabled={!canCreateAgreement}
          />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Contracts" value={String(agreements.filter(a => a.status === "Active").length)} helper="Legally binding" icon={FileText} tone="blue" />
        <MetricCard label="Under Review" value={String(agreements.filter(a => a.status === "Under Review").length)} helper="Awaiting signature" icon={Clock} tone="amber" />
        <MetricCard label="Contract Value" value={totalValueLabel} helper="Total book value" icon={ShieldCheck} tone="green" />
        <MetricCard label="Expiring Soon" value={String(expiringSoonCount).padStart(2, "0")} helper="Within 30 days" icon={AlertTriangle} tone="red" />
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-black text-blue-700">
          Loading backend agreements...
        </div>
      ) : null}
      {formError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-black text-rose-700">
          {formError}
        </div>
      ) : null}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => {
                setShowForm(false);
                setSelectedFileName("");
                setFileError("");
              }}
              className="absolute right-8 top-8 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-primary transition-all"
            >
              <X size={24} />
            </button>

            {successMsg ? (
              <div className="py-20 text-center space-y-4 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-black text-primary">Agreement Registered</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Contract record has been secured.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                  <div>
                    <h3 className="text-3xl font-black text-primary tracking-tight">Register Legal Agreement</h3>
                    <p className="text-slate-500 font-medium mt-1">Upload signed documents and link them to clients and financial value.</p>
                  </div>
                  <StatusBadge tone="blue">Legal Hub</StatusBadge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3 space-y-10">
                    <Panel title="Contract Details" description="Basic identification and scope.">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3 md:col-span-2">
                          <div className="flex items-center justify-between gap-3">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                              Project Link
                            </label>
                            <div className="inline-flex rounded-xl border border-border bg-slate-50 p-1">
                              {(["existing", "manual"] as const).map((mode) => (
                                <button
                                  key={mode}
                                  type="button"
                                  onClick={() => {
                                    setProjectEntryMode(mode);
                                    if (mode === "manual") setValue("projectId", "");
                                  }}
                                  className={`h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                                    projectEntryMode === mode ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-primary"
                                  }`}
                                >
                                  {mode === "existing" ? "Created Project" : "Manual"}
                                </button>
                              ))}
                            </div>
                          </div>
                          {projectEntryMode === "existing" ? (
                            <select
                              value={selectedProjectId ? projectOptions.find((option) => option.startsWith(`${selectedProjectId} - `)) || "" : ""}
                              onChange={(event) => setValue("projectId", event.target.value.split(" - ")[0] || "", { shouldValidate: true })}
                              className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                            >
                              <option value="">Select created project...</option>
                              {projectOptions.map((project) => <option key={project}>{project}</option>)}
                            </select>
                          ) : (
                            <Field label="Manual Project ID" placeholder="Optional project ID" register={register("projectId")} />
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                              Client Name <span className="text-red-500">*</span>
                            </label>
                            <div className="inline-flex rounded-xl border border-border bg-slate-50 p-1">
                              {(["existing", "manual"] as const).map((mode) => (
                                <button
                                  key={mode}
                                  type="button"
                                  onClick={() => setClientEntryMode(mode)}
                                  className={`h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                                    clientEntryMode === mode ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-primary"
                                  }`}
                                >
                                  {mode === "existing" ? "Existing" : "New"}
                                </button>
                              ))}
                            </div>
                          </div>
                          {clientEntryMode === "existing" ? (
                            <Field label="Select Existing Client" options={combinedClientOptions} register={register("clientName")} error={errors.clientName?.message} />
                          ) : (
                            <Field label="New Client Name" placeholder="Type client/company name" register={register("clientName")} error={errors.clientName?.message} />
                          )}
                        </div>
                        <Field label="Project Name" placeholder="e.g. Enterprise Dashboard v2" required register={register("projectName")} error={errors.projectName?.message} />
                        <Field label="Agreement Type" options={["Master Service Agreement (MSA)", "Statement of Work (SOW)", "Non-Disclosure Agreement (NDA)", "Service Level Agreement (SLA)"]} register={register("agreementType")} />
                        <Field label="Effective Date" type="date" required register={register("effectiveDate")} error={errors.effectiveDate?.message} />
                        <Field label="Expiry / Review Date" type="date" register={register("expiryDate")} error={errors.expiryDate?.message} />
                        <Field label="Contract Value (INR)" type="number" register={register("contractValue")} />
                      </div>
                    </Panel>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <Panel title="Financial Terms" description="Payment schedules and milestones.">
                          <Field label="Payment Milestones" multiline placeholder="e.g. 30% Advance, 40% UAT, 30% Deployment" register={register("paymentTerms")} />
                       </Panel>

                       <Panel title="Legal Attachment" description="Upload the signed agreement PDF.">
                          <label className="p-6 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 flex flex-col items-center justify-center text-center group hover:border-primary transition-all cursor-pointer h-full">
                             <input
                               type="file"
                               accept="application/pdf"
                               className="sr-only"
                               onChange={(event) => handleAgreementFile(event.target.files?.[0])}
                             />
                             <Upload className="text-primary mb-3" size={32} />
                             <p className="text-[10px] font-black text-primary uppercase tracking-widest">Signed PDF Upload</p>
                             <p className={`mt-1 text-[10px] font-bold ${selectedFileName ? "text-emerald-600" : "text-slate-400"}`}>
                               {fileError || selectedFileName || "PDF, MAX 15MB"}
                             </p>
                             <span className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-primary group-hover:shadow-md transition-all">
                               {selectedFileName ? "Replace File" : "Browse File"}
                             </span>
                          </label>
                       </Panel>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <Panel title="Lifecycle Status" description="Set current legal state.">
                      <div className="space-y-6">
                        <Field label="Agreement Status" options={["Draft", "Under Review", "Sent for Signature", "Active", "Expired", "Terminated"]} register={register("status")} />
                        
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
                           <ShieldCheck className="text-emerald-600 shrink-0" size={18} />
                           <p className="text-[10px] font-bold text-emerald-800 leading-4">Active agreements are automatically used to validate new Invoices and Quotations.</p>
                        </div>

                        <div className="flex flex-col gap-3">
                          <ActionButton label="Secure Record" variant="accent" type="submit" disabled={!canCreateAgreement} />
                          <ActionButton label="Save as Draft" variant="outline" onClick={() => { setShowForm(false); setSelectedFileName(""); setFileError(""); }} />
                        </div>
                      </div>
                    </Panel>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Panel 
        title="Legal Agreement Repository" 
        description="Unified registry for project documents, signed agreements, and active MSAs."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search contracts..."
                className="h-9 w-56 rounded-xl border border-border bg-white pl-9 pr-3 text-xs font-bold text-primary outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <StatusBadge tone="green">{filteredAgreements.length} Contracts</StatusBadge>
          </div>
        }
      >
        <DataTable columns={["Agreement ID", "Client & Project", "Type", "Effective / Expiry", "Value", "Status", "Attachment", "Actions"]}>
          {filteredAgreements.map((note) => (
            <tr key={note.id} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4">
                 <p className="font-black text-primary">{note.id}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tracking-tighter">Legal Master</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-black text-primary">{note.client}</p>
                <p className="text-xs font-semibold text-slate-500">{note.project}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{note.projectId}</p>
              </td>
              <td className="px-4 py-4">
                <StatusBadge tone="blue">{note.type}</StatusBadge>
              </td>
              <td className="px-4 py-4">
                <p className="font-semibold text-slate-600">{note.date}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">{note.expiryDate}</p>
              </td>
              <td className="px-4 py-4 font-black text-primary">{note.value}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={note.status === "Active" ? "green" : "amber"}>{note.status}</StatusBadge>
              </td>
              <td className="px-4 py-4">
                <p className={`max-w-[180px] truncate text-xs font-bold ${note.attachmentName === "Pending upload" ? "text-amber-600" : "text-slate-600"}`}>
                  {note.attachmentName}
                </p>
              </td>
              <td className="px-4 py-4 text-right">
                <button type="button" onClick={() => handleDownloadAgreement(note)} disabled={!canViewAgreement} className="text-primary hover:underline font-black text-[10px] uppercase tracking-widest flex items-center justify-end gap-2 ml-auto disabled:cursor-not-allowed disabled:opacity-50">
                   <Download size={14} /> Agreement
                </button>
              </td>
            </tr>
          ))}
        </DataTable>
        {filteredAgreements.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-slate-50 p-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">
            No agreements found
          </div>
        ) : null}
      </Panel>
    </AccountingPage>
  );
}
