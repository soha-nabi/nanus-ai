import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../features/auth/AuthContext";
import { createDocumentRecord, listDocumentRecords } from "../lib/demoStore";
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

function DocumentItem({ document }: { document: DocumentRecord }) {
  return (
    <li className="space-y-2 rounded-lg border border-sage bg-white p-4">
      <p className="text-lg font-semibold break-words">{document.title}</p>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-base sm:grid-cols-2">
        <div>
          <dt className="inline font-semibold">Type: </dt>
          <dd className="inline">{DOCUMENT_TYPE_LABELS[document.document_type]}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Document date: </dt>
          <dd className="inline">{document.document_date ?? "Not recorded"}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">File name: </dt>
          <dd className="inline break-all">{document.file_name}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Date added: </dt>
          <dd className="inline">{formatDateTime(document.created_at)}</dd>
        </div>
      </dl>
    </li>
  );
}

export default function DocumentVaultPage() {
  const { user, family, elder, membership, isDemo } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [createError, setCreateError] = useState<string | null>(null);
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

  const inputClass =
    "mt-2 block min-h-12 w-full rounded-lg border border-sage bg-white px-4 py-3 text-lg text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest";

  const sectionClass = "space-y-4";
  const emptyClass = "rounded-lg border border-sage bg-white p-4 text-base";

  return (
    <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Document vault</h1>
          <p className="mt-2 text-lg leading-relaxed">{family.name}</p>
          {isDemo && (
            <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">
              Demo mode: document details are stored only in this browser.
            </p>
          )}
          <p className="mt-4 rounded-lg border border-coral bg-white p-4 text-base">
            Demo mode stores document details only. The file itself is not uploaded or kept, so it cannot be opened
            later.
          </p>
          <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">
            Document details are for reference only and are not medical instructions.
          </p>
        </header>

        <section aria-labelledby="documents-heading" className={sectionClass}>
          <h2 id="documents-heading" className="text-2xl font-semibold text-forest">
            Documents
          </h2>
          {documents.length === 0 ? (
            <p className={emptyClass}>No documents recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {documents.map((document) => (
                <DocumentItem key={document.id} document={document} />
              ))}
            </ul>
          )}
        </section>

        {canManage ? (
          <section aria-labelledby="add-document-heading" className={sectionClass}>
            <h2 id="add-document-heading" className="text-2xl font-semibold text-forest">
              Add document details
            </h2>
            <form
              onSubmit={handleSubmit(onCreate)}
              noValidate
              className="space-y-4 rounded-lg border border-sage bg-white p-4"
            >
              <div>
                <label htmlFor="document-title" className="text-lg font-semibold">
                  Title
                </label>
                <input
                  id="document-title"
                  type="text"
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
                  <p id="document-title-error" role="alert" className="mt-2 text-base text-forest">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="document-type" className="text-lg font-semibold">
                  Document type
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
                <label htmlFor="document-date" className="text-lg font-semibold">
                  Document date (optional)
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
                  <p id="document-date-error" role="alert" className="mt-2 text-base text-forest">
                    {errors.documentDate.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="document-file" className="text-lg font-semibold">
                  File
                </label>
                <input
                  id="document-file"
                  ref={fileInputRef}
                  type="file"
                  onChange={onFileChange}
                  className="mt-2 block min-h-12 w-full text-lg text-charcoal file:mr-4 file:min-h-12 file:rounded-lg file:border-0 file:bg-sage file:px-4 file:py-3 file:text-lg file:font-semibold file:text-charcoal"
                />
                <p className="mt-2 text-base">
                  {selectedFileName ? `Selected file name: ${selectedFileName}` : "No file selected."}
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal disabled:opacity-60"
              >
                Save document details
              </button>

              {createError && (
                <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
                  {createError}
                </p>
              )}
            </form>
          </section>
        ) : (
          <p className={emptyClass}>Only the family owner or a family member can add documents.</p>
        )}
      </div>
    </main>
  );
}
