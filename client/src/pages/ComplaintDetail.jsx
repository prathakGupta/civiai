import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  fetchComplaintById,
  getErrorMessage,
  patchComplaintStatus,
  uploadImage,
  verifyComplaint
} from "../api/complaints";
import { getUserRole } from "../lib/auth";

const STATUS_OPTIONS = ["PENDING", "IN_REVIEW", "ASSIGNED", "RESOLVED", "REJECTED"];

function formatDate(value) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString();
}

function toPrettyJson(value) {
  if (!value) return "None";
  try {
    return JSON.stringify(value);
  } catch {
    return "Invalid JSON";
  }
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const userRole = getUserRole();
  const isAdmin = userRole === "ADMIN";

  const [complaint, setComplaint] = useState(null);
  const [statusValue, setStatusValue] = useState("PENDING");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyPreview, setVerifyPreview] = useState("");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!verifyFile) {
      setVerifyPreview("");
      return undefined;
    }

    const preview = URL.createObjectURL(verifyFile);
    setVerifyPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [verifyFile]);

  useEffect(() => {
    let mounted = true;

    async function loadComplaint() {
      if (!id) return;
      setIsLoading(true);
      setError("");

      try {
        const payload = await fetchComplaintById(id);
        if (!mounted) return;
        setComplaint(payload);
        setStatusValue(payload.status || "PENDING");
      } catch (requestError) {
        if (!mounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadComplaint();
    return () => {
      mounted = false;
    };
  }, [id]);

  async function refreshComplaint() {
    if (!id) return;
    const payload = await fetchComplaintById(id);
    setComplaint(payload);
    setStatusValue(payload.status || "PENDING");
  }

  async function handleStatusSubmit(event) {
    event.preventDefault();
    if (!id || !isAdmin) return;

    setStatusMessage("");
    setStatusError("");
    setIsSavingStatus(true);

    try {
      await patchComplaintStatus(id, statusValue);
      await refreshComplaint();
      setStatusMessage("Status updated successfully.");
    } catch (requestError) {
      setStatusError(getErrorMessage(requestError));
    } finally {
      setIsSavingStatus(false);
    }
  }

  async function handleVerifySubmit(event) {
    event.preventDefault();
    if (!id || !isAdmin) return;

    setVerifyMessage("");
    setVerifyError("");

    if (!verifyFile) {
      setVerifyError("Please upload an after-resolution image.");
      return;
    }

    setIsVerifying(true);

    try {
      const uploaded = await uploadImage(verifyFile);
      await verifyComplaint(id, {
        afterImageUrl: uploaded.url,
        afterImagePublicId: uploaded.publicId,
        afterImageMimeType: uploaded.mimeType
      });
      setVerifyFile(null);
      await refreshComplaint();
      setVerifyMessage("Verification completed.");
    } catch (requestError) {
      setVerifyError(getErrorMessage(requestError));
    } finally {
      setIsVerifying(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto h-full relative p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto premium-card rounded-3xl p-6 animate-pulse">
          <div className="h-5 w-48 bg-surface-container rounded-lg mb-4" />
          <div className="h-4 w-full bg-surface-container rounded-lg mb-2" />
          <div className="h-4 w-10/12 bg-surface-container rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto h-full relative p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 font-semibold">
          {error}
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="flex-1 overflow-y-auto h-full relative p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto premium-card rounded-2xl p-6">Complaint not found.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto h-full relative p-6 md:p-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="premium-card card-hover-lift rounded-3xl overflow-hidden tilt-soft enter-up">
            <div className="relative h-64 overflow-hidden">
              <img
                alt="Complaint evidence before resolution"
                className="w-full h-full object-cover"
                src={complaint.imageUrl}
              />
              <div className="absolute top-4 left-4">
                <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-widest">
                  Evidence: Before
                </span>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Created {formatDate(complaint.createdAt)}</span>
              <span className="text-xs font-bold text-slate-700">{complaint.id}</span>
            </div>
          </div>

          <div className="premium-card card-hover-lift rounded-3xl overflow-hidden enter-up">
            <div className="flex-1 bg-slate-100 relative min-h-[200px] flex items-center justify-center">
              <div className="text-center px-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-bold">Geolocation</p>
                <p className="font-semibold mt-2">{complaint.locationText}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {typeof complaint.latitude === "number" && typeof complaint.longitude === "number"
                    ? `${complaint.latitude}, ${complaint.longitude}`
                    : "Coordinates not provided"}
                </p>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-sm">
                <strong>Issue Type:</strong> {complaint.issueType}
              </p>
              <p className="text-sm">
                <strong>Severity:</strong> {complaint.severity}
              </p>
              <p className="text-sm">
                <strong>Status:</strong> {complaint.status}
              </p>
            </div>
          </div>
        </section>

        <section className="premium-card card-hover-lift rounded-3xl p-6 space-y-3 enter-up">
          <h3 className="font-headline text-xl font-black">Case Context</h3>
          <p className="text-sm">
            <strong>Description:</strong> {complaint.description || "No description provided."}
          </p>
          <p className="text-sm">
            <strong>Department:</strong> {complaint.department || "Unassigned"}
          </p>
          <p className="text-sm">
            <strong>AI Summary:</strong> {complaint.aiSummary || "No AI summary available"}
          </p>
          <p className="text-sm">
            <strong>Reporter:</strong> {complaint.reportedByName || "Anonymous"} ({complaint.reportedByEmail || "No email"})
          </p>
        </section>

        {!isAdmin && (
          <section className="premium-card rounded-2xl p-4 text-amber-800 text-sm font-semibold border border-amber-200/70 bg-amber-50/85">
            You are currently in {userRole} mode. Switch role to ADMIN and provide the admin
            password in the top bar to run status updates and verification actions.
          </section>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <article className="premium-card card-hover-lift rounded-3xl p-6 enter-up">
            <h3 className="font-headline text-xl font-black mb-4">Update Status</h3>
            <form className="space-y-3" onSubmit={handleStatusSubmit}>
              <select
                className="w-full rounded-xl p-2.5 text-sm"
                value={statusValue}
                onChange={(event) => setStatusValue(event.target.value)}
                disabled={!isAdmin || isSavingStatus}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button
                className="btn-premium px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                type="submit"
                disabled={!isAdmin || isSavingStatus}
              >
                {isSavingStatus ? "Saving..." : "Save Status"}
              </button>
              {statusMessage && <p className="text-sm text-emerald-700 font-semibold">{statusMessage}</p>}
              {statusError && <p className="text-sm text-red-700 font-semibold">{statusError}</p>}
            </form>
          </article>

          <article className="premium-card card-hover-lift rounded-3xl p-6 enter-up">
            <h3 className="font-headline text-xl font-black mb-4">Verify Resolution</h3>
            <form className="space-y-3" onSubmit={handleVerifySubmit}>
              <input
                className="block w-full rounded-xl p-2.5 text-sm"
                type="file"
                accept="image/*"
                disabled={!isAdmin || isVerifying}
                onChange={(event) => setVerifyFile(event.target.files?.[0] || null)}
              />
              {verifyPreview && (
                <div className="premium-card rounded-2xl overflow-hidden border border-slate-200/70">
                  <img src={verifyPreview} alt="After resolution preview" className="w-full h-40 object-cover" />
                </div>
              )}
              <button
                className="btn-premium px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                type="submit"
                disabled={!isAdmin || isVerifying}
              >
                {isVerifying ? "Verifying..." : "Run Verification"}
              </button>
              {verifyMessage && <p className="text-sm text-emerald-700 font-semibold">{verifyMessage}</p>}
              {verifyError && <p className="text-sm text-red-700 font-semibold">{verifyError}</p>}
            </form>
          </article>
        </section>

        {complaint.verification && (
          <section className="premium-card card-hover-lift rounded-3xl p-6 space-y-2 enter-up">
            <h3 className="font-headline text-xl font-black">Latest Verification</h3>
            <p className="text-sm">
              <strong>Status:</strong> {complaint.verification.verificationStatus}
            </p>
            <p className="text-sm">
              <strong>Summary:</strong> {complaint.verification.verificationSummary || "No summary"}
            </p>
            <p className="text-sm">
              <strong>Confidence:</strong>{" "}
              {typeof complaint.verification.verificationConfidence === "number"
                ? `${Math.round(complaint.verification.verificationConfidence * 100)}%`
                : "Unknown"}
            </p>
            <p className="text-sm">
              <strong>Updated:</strong> {formatDate(complaint.verification.updatedAt)}
            </p>
          </section>
        )}

        <section className="premium-card card-hover-lift rounded-3xl p-6 enter-up">
          <h3 className="font-headline text-xl font-black mb-4">Audit Timeline</h3>
          {complaint.auditLogs?.length ? (
            <div className="space-y-3">
              {complaint.auditLogs.map((log) => (
                <div className="premium-card rounded-xl p-3 border border-slate-200/70 card-hover-lift" key={log.id}>
                  <p className="text-sm font-semibold">
                    {log.action} | {formatDate(log.createdAt)}
                  </p>
                  <p className="text-xs text-secondary mt-1">Old: {toPrettyJson(log.oldValue)}</p>
                  <p className="text-xs text-secondary">New: {toPrettyJson(log.newValue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary">No audit entries yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
