import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../features/auth/AuthContext";
import FamilyNav from "../components/FamilyNav";
import DemoRoleSwitcher from "../components/DemoRoleSwitcher";
import {
  createDocumentRecord,
  listDocumentRecords,
  getDocumentIntelligence,
} from "../lib/demoStore";
import type { DocumentRecord, DocumentType } from "../lib/types";

const DOCUMENT_TYPES = ["prescription", "report", "other"] as const;

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  prescription: "Prescription",
  report: "Report",
  other: "Other",
};

const titleSchema = z.string().trim().min(3, "Title must be at least 3 characters.");
const documentDateSchema = z
  .string()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a date as YYYY-MM-DD.");

const documentSchema = z.object({
  title: titleSchema,
  documentType: z.enum(DOCUMENT_TYPES),
  documentDate: documentDateSchema,
});

type DocumentFormValues = z.infer<typeof documentSchema>;

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function DocumentItem({
  document,
  onReviewIntelligence,
}: {
  document: DocumentRecord;
  onReviewIntelligence: (doc: DocumentRecord) => void;
}) {
  return (
    <li className="space-y-3 rounded-xl border border-sage/80 bg-white p-5 shadow-sm transition-all hover:border-forest/40">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-sage/40 pb-3">
        <p className="text-lg font-bold text-forest break-words">{document.title}</p>
        <span className="rounded-full bg-forest/10 px-3 py-0.5 text-xs font-semibold text-forest self-start sm:self-auto">
          {DOCUMENT_TYPE_LABELS[document.document_type]}
        </span>
      </div>

      <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
        <div>
          <dt className="inline font-semibold text-charcoal/70">Document date: </dt>
          <dd className="inline font-medium text-charcoal">{document.document_date ?? "Not recorded"}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-charcoal/70">File reference: </dt>
          <dd className="inline break-all text-charcoal font-mono text-xs">{document.file_name}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-charcoal/70">Date uploaded: </dt>
          <dd className="inline text-charcoal">{formatDateTime(document.created_at)}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-charcoal/70">Storage vault: </dt>
          <dd className="inline text-forest font-medium">Private Encrypted Bucket</dd>
        </div>
      </dl>

      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-sage/30">
        <span className="text-xs text-charcoal/60">
          🔒 Private document • Accessible only by authorized family members
        </span>
        <button
          type="button"
          onClick={() => onReviewIntelligence(document)}
          className="rounded-lg bg-sage/30 border border-sage px-3 py-1.5 text-xs font-semibold text-forest hover:bg-forest hover:text-ivory transition-colors flex items-center gap-1.5"
        >
          <span>🔍 Document Intelligence Review</span>
        </button>
      </div>
    </li>
  );
}

export default function DocumentVaultPage() {
  const { user, family, elder, membership } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<DocumentType | "all">("all");
  const [activeIntelligenceDoc, setActiveIntelligenceDoc] = useState<DocumentRecord | null>(null);
  const [intelligenceConfirmed, setIntelligenceConfirmed] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const familyId = family?.id ?? null;
  const canManage = membership?.role === "owner" || membership?.role === "family_member";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DocumentFormValues>({
    defaultValues: {
      title: "",
      documentType: "prescription",
      documentDate: "",
    },
  });

  const reload = useCallback(() => {
    if (!familyId) return;
    setDocuments(listDocumentRecords(familyId));
  }, [familyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!family || !user) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Document vault</h1>
          <p className="mt-4 text-lg leading-relaxed">Create or join a family to see its documents.</p>
        </div>
      </main>
    );
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFileName(event.target.files?.[0]?.name ?? "");
  };

  const onCreate = (values: DocumentFormValues) => {
    setCreateError(null);
    try {
      if (!elder) {
        throw new Error("Add the elder's profile before adding documents.");
      }
      if (!selectedFileName) {
        throw new Error("Choose a file to record its name.");
      }
      createDocumentRecord({
        familyId: family.id,
        elderId: elder.id,
        actorId: user.id,
        title: values.title,
        documentType: values.documentType,
        documentDate: values.documentDate || null,
        fileName: selectedFileName,
      });
      reset();
      setSelectedFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      reload();
    } catch (err) {
      setCreateError(errorMessage(err));
    }
  };

  const filteredDocs =
    filterType === "all" ? documents : documents.filter((d) => d.document_type === filterType);

  const activeIntelligence = activeIntelligenceDoc
    ? getDocumentIntelligence(activeIntelligenceDoc.id)
    : null;

  const inputClass =
    "mt-2 block min-h-12 w-full rounded-lg border border-sage bg-white px-4 py-3 text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest";

  const sectionClass = "space-y-4";
  const emptyClass = "rounded-lg border border-sage bg-white p-6 text-center text-charcoal/70";

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <DemoRoleSwitcher />
      <FamilyNav />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
        <header className="border-b border-sage/60 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-forest sm:text-4xl">
                Document Vault
              </h1>
              <p className="mt-1 text-sm text-charcoal/80">
                Secure, private repository for prescriptions, diagnostic scans, and clinical discharge summaries.
              </p>
            </div>
            <div className="rounded-full bg-forest/10 border border-forest/20 px-3.5 py-1 text-xs font-semibold text-forest self-start sm:self-auto">
              🔒 Private Storage Encrypted
            </div>
          </div>
        </header>

        {/* Categories / Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
              filterType === "all"
                ? "bg-forest text-ivory"
                : "bg-white border border-sage text-charcoal hover:bg-sage/20"
            }`}
          >
            All Documents ({documents.length})
          </button>
          {DOCUMENT_TYPES.map((t) => {
            const count = documents.filter((d) => d.document_type === t).length;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                  filterType === t
                    ? "bg-forest text-ivory"
                    : "bg-white border border-sage text-charcoal hover:bg-sage/20"
                }`}
              >
                {DOCUMENT_TYPE_LABELS[t]} ({count})
              </button>
            );
          })}
        </div>

        {/* Document List */}
        <section aria-labelledby="documents-heading" className={sectionClass}>
          <h2 id="documents-heading" className="font-serif text-2xl font-bold text-forest">
            Stored Records ({filteredDocs.length})
          </h2>
          {filteredDocs.length === 0 ? (
            <p className={emptyClass}>No documents recorded in this category.</p>
          ) : (
            <ul className="space-y-4">
              {filteredDocs.map((document) => (
                <DocumentItem
                  key={document.id}
                  document={document}
                  onReviewIntelligence={(doc) => setActiveIntelligenceDoc(doc)}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Upload / Add Form */}
        {canManage ? (
          <section aria-labelledby="add-document-heading" className="border-t border-sage/60 pt-8 space-y-4">
            <h2 id="add-document-heading" className="font-serif text-2xl font-bold text-forest">
              Add Medical Record to Vault
            </h2>
            <form
              onSubmit={handleSubmit(onCreate)}
              noValidate
              className="space-y-4 rounded-xl border border-sage bg-white p-6 shadow-sm"
            >
              <div>
                <label htmlFor="document-title" className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                  Document Title
                </label>
                <input
                  id="document-title"
                  type="text"
                  placeholder="e.g. Apollo Hospital Cardiology Consultation"
                  autoComplete="off"
                  className={inputClass}
                  aria-invalid={errors.title ? "true" : "false"}
                  aria-describedby={errors.title ? "document-title-error" : undefined}
                  {...register("title", {
                    validate: (value) => {
                      const result = titleSchema.safeParse(value);
                      return result.success || result.error.issues[0]?.message || "Enter a document title.";
                    },
                  })}
                />
                {errors.title && (
                  <p id="document-title-error" role="alert" className="mt-1 text-xs text-coral">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="document-type" className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                    Document Category
                  </label>
                  <select id="document-type" className={inputClass} {...register("documentType")}>
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {DOCUMENT_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="document-date" className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                    Prescription / Report Date (Optional)
                  </label>
                  <input
                    id="document-date"
                    type="date"
                    className={inputClass}
                    aria-invalid={errors.documentDate ? "true" : "false"}
                    aria-describedby={errors.documentDate ? "document-date-error" : undefined}
                    {...register("documentDate", {
                      validate: (value) => {
                        const result = documentDateSchema.safeParse(value);
                        return result.success || result.error.issues[0]?.message || "Enter a valid date.";
                      },
                    })}
                  />
                  {errors.documentDate && (
                    <p id="document-date-error" role="alert" className="mt-1 text-xs text-coral">
                      {errors.documentDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="document-file" className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                  File Attachment (PDF or Image)
                </label>
                <input
                  id="document-file"
                  ref={fileInputRef}
                  type="file"
                  onChange={onFileChange}
                  className="mt-2 block w-full text-sm text-charcoal file:mr-4 file:rounded-md file:border-0 file:bg-forest file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-ivory hover:file:bg-forest/90"
                />
                <p className="mt-2 text-xs text-charcoal/70">
                  {selectedFileName ? `Selected: ${selectedFileName}` : "Select a PDF, scan or clinical photo."}
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-forest px-6 py-3 text-sm font-semibold text-ivory hover:bg-forest/90 disabled:opacity-60 transition-colors shadow-sm"
              >
                Save Record to Vault
              </button>

              {createError && (
                <p role="alert" className="rounded-lg border border-coral bg-coral/10 p-3 text-xs text-charcoal">
                  {createError}
                </p>
              )}
            </form>
          </section>
        ) : (
          <p className={emptyClass}>Only the family owner or a family member can add documents.</p>
        )}

        {/* DOCUMENT INTELLIGENCE REVIEW MODAL (Module 8) */}
        {activeIntelligenceDoc && activeIntelligence && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-sage bg-white p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-sage/40 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔍</span>
                  <h3 className="font-serif text-xl font-bold text-forest">
                    Document Intelligence Review
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveIntelligenceDoc(null)}
                  className="rounded-full p-1.5 text-charcoal/60 hover:bg-ivory hover:text-charcoal"
                >
                  ✕
                </button>
              </div>

              {/* Mandatory Regulatory & Medical Disclaimer Badge */}
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-1">
                <p className="font-bold">⚠️ For Human Review & Verification Only</p>
                <p>
                  Document Intelligence extracts potential medications and clinical dates for family convenience.
                  It is <strong>never automatically converted into an authoritative prescription or medical instruction</strong> without manual confirmation.
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs font-semibold text-charcoal/70 uppercase">Document Ref:</span>
                  <p className="font-medium text-forest">{activeIntelligence.extractedTitle}</p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-charcoal/70 uppercase">Attending Clinician / Facility:</span>
                  <p className="text-charcoal">{activeIntelligence.extractedDoctorOrClinic}</p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-charcoal/70 uppercase">Detected Dates:</span>
                  <p className="text-charcoal">{activeIntelligence.extractedDates.join(" • ")}</p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-charcoal/70 uppercase">
                    Extracted Medications for Human Verification:
                  </span>
                  <div className="mt-2 space-y-2">
                    {activeIntelligence.extractedMedications.map((m, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-sage/60 bg-ivory/50 p-3 flex items-start justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-forest text-sm">{m.name}</p>
                          <p className="text-charcoal/80 mt-0.5">{m.dosageInstructions}</p>
                        </div>
                        <span className="rounded bg-forest/10 px-2 py-0.5 font-mono text-[10px] text-forest font-semibold">
                          Confidence: {Math.round(m.confidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-sage/40 pt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-charcoal/60">
                  {intelligenceConfirmed[activeIntelligenceDoc.id]
                    ? "✓ Human verification recorded"
                    : "Awaiting family confirmation"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveIntelligenceDoc(null)}
                    className="rounded-lg border border-sage px-4 py-2 text-xs font-medium hover:bg-sage/20"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIntelligenceConfirmed({
                        ...intelligenceConfirmed,
                        [activeIntelligenceDoc.id]: true,
                      });
                      setActiveIntelligenceDoc(null);
                    }}
                    className="rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-ivory hover:bg-forest/90"
                  >
                    Confirm & Record Human Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
