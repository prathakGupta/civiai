import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import exifr from "exifr";
import { createComplaint, getErrorMessage, uploadImage } from "../api/complaints";
import { LocateFixed } from "lucide-react";

const defaultForm = {
  locationText: "",
  description: "",
  reportedByName: "",
  reportedByEmail: "",
  latitude: "",
  longitude: ""
};

function buildPayload(form, uploadResult) {
  const payload = {
    imageUrl: uploadResult.url,
    imagePublicId: uploadResult.publicId,
    imageMimeType: uploadResult.mimeType,
    locationText: form.locationText.trim()
  };

  if (form.description.trim()) payload.description = form.description.trim();
  if (form.reportedByName.trim()) payload.reportedByName = form.reportedByName.trim();
  if (form.reportedByEmail.trim()) payload.reportedByEmail = form.reportedByEmail.trim();
  if (form.latitude.trim()) payload.latitude = Number(form.latitude);
  if (form.longitude.trim()) payload.longitude = Number(form.longitude);
  return payload;
}

function badgeClass(kind, value) {
  if (kind === "severity") {
    if (value === "CRITICAL") return "bg-red-100 text-red-700";
    if (value === "HIGH") return "bg-orange-100 text-orange-700";
    if (value === "MEDIUM") return "bg-yellow-100 text-yellow-700";
    return "bg-emerald-100 text-emerald-700";
  }

  if (kind === "status") {
    if (value === "PENDING") return "bg-amber-100 text-amber-800";
    if (value === "ASSIGNED") return "bg-blue-100 text-blue-800";
    if (value === "RESOLVED") return "bg-emerald-100 text-emerald-800";
    return "bg-slate-100 text-slate-700";
  }

  return "bg-slate-100 text-slate-700";
}

export default function ReportIssue() {
  const [form, setForm] = useState(defaultForm);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [createdComplaint, setCreatedComplaint] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    if (!form.locationText.trim()) {
      setError("Location is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadResult = await uploadImage(file);
      const payload = buildPayload(form, uploadResult);
      const complaint = await createComplaint(payload);
      setCreatedComplaint(complaint);
      setForm(defaultForm);
      setFile(null);
      setMessage("Complaint submitted. AI classification completed.");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDetectLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    
    setIsDetecting(true);
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }));
        setLocationMessage("Location securely detected from your device.");
        setIsDetecting(false);
      },
      (geoError) => {
        console.error(geoError);
        setError("Unable to retrieve your location from device sensors.");
        setIsDetecting(false);
      }
    );
  }

  return (
    <div className="flex-1 overflow-y-auto h-full relative p-6 md:p-8">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[1.24fr_0.76fr] gap-6">
        <section className="premium-card card-hover-lift rounded-3xl p-6 md:p-7 enter-up">
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">
            Report a Civic Concern
          </h1>
          <p className="text-on-surface-variant leading-relaxed mb-8">
            Upload evidence and CiviAI will classify, prioritize, and route the issue instantly.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.16em] font-bold text-secondary">Issue Image</span>
              <input
                className="mt-2 block w-full rounded-xl p-2.5 text-sm"
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const selectedFile = event.target.files?.[0] || null;
                  setFile(selectedFile);
                  
                  if (selectedFile) {
                    try {
                      // Attempt to extract GPS from EXIF
                      const gps = await exifr.gps(selectedFile);
                      if (gps && typeof gps.latitude === "number" && typeof gps.longitude === "number") {
                        setForm((prev) => ({
                          ...prev,
                          latitude: gps.latitude.toString(),
                          longitude: gps.longitude.toString()
                        }));
                        setLocationMessage("Location extracted from image metadata.");
                      } else {
                        setLocationMessage("");
                      }
                    } catch (e) {
                      console.debug("No EXIF GPS data found or format unsupported", e);
                      setLocationMessage("");
                    }
                  } else {
                    setLocationMessage("");
                  }
                }}
              />
            </label>

            {previewUrl && (
              <div className="premium-card rounded-2xl overflow-hidden border border-slate-200/70">
                <img src={previewUrl} alt="Issue preview" className="w-full h-56 object-cover" />
              </div>
            )}

            <label className="block">
              <span className="text-xs uppercase tracking-[0.16em] font-bold text-secondary">Location *</span>
              <input
                className="mt-2 block w-full rounded-xl p-2.5 text-sm"
                name="locationText"
                value={form.locationText}
                onChange={handleChange}
                placeholder="Example: MG Road, near metro gate 2"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.16em] font-bold text-secondary">Description</span>
              <textarea
                className="mt-2 block w-full rounded-xl p-2.5 text-sm min-h-[120px]"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the issue for field teams."
              />
            </label>

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.16em] font-bold text-secondary">Coordinates (Optional)</span>
                <button 
                  type="button" 
                  onClick={handleDetectLocation}
                  disabled={isDetecting}
                  className="text-xs font-bold px-3 py-1.5 bg-blue-50/80 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <LocateFixed size={16} />
                  {isDetecting ? "Detecting..." : "Detect Location"}
                </button>
              </div>
              
              {locationMessage && <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">{locationMessage}</p>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                  <input
                    className="block w-full rounded-xl p-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    name="latitude"
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={form.latitude}
                    onChange={handleChange}
                  />
                </label>
                <label className="block">
                  <input
                    className="block w-full rounded-xl p-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    name="longitude"
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={form.longitude}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] font-bold text-secondary">Your Name</span>
                <input
                  className="mt-2 block w-full rounded-xl p-2.5 text-sm"
                  name="reportedByName"
                  value={form.reportedByName}
                  onChange={handleChange}
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] font-bold text-secondary">Email</span>
                <input
                  className="mt-2 block w-full rounded-xl p-2.5 text-sm"
                  name="reportedByEmail"
                  type="email"
                  value={form.reportedByEmail}
                  onChange={handleChange}
                />
              </label>
            </div>

            <button
              className="btn-premium px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Submitting..." : "Submit Complaint"}
            </button>

            {message && <p className="text-sm font-semibold text-emerald-700">{message}</p>}
            {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
          </form>
        </section>

        <aside className="premium-card card-hover-lift rounded-3xl p-6 md:p-7 enter-up">
          <h2 className="text-xl font-black font-headline mb-2">Latest Submission</h2>
          <p className="text-sm text-secondary mb-5">
            AI classification and routing details for the most recent report.
          </p>

          {!createdComplaint && (
            <p className="text-sm text-secondary">
              No complaint submitted in this session yet.
            </p>
          )}

          {createdComplaint && (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${badgeClass(
                    "status",
                    createdComplaint.status
                  )}`}
                >
                  {createdComplaint.status}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${badgeClass(
                    "severity",
                    createdComplaint.severity
                  )}`}
                >
                  {createdComplaint.severity}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                  {createdComplaint.issueType}
                </span>
              </div>
              <p className="text-sm">
                <strong>Location:</strong> {createdComplaint.locationText}
              </p>
              <p className="text-sm">
                <strong>Department:</strong> {createdComplaint.department || "Unassigned"}
              </p>
              <p className="text-sm">
                <strong>AI Summary:</strong> {createdComplaint.aiSummary || "No summary available"}
              </p>
              <Link
                className="inline-flex text-primary font-semibold text-sm hover:underline"
                to={`/complaint/${createdComplaint.id}`}
              >
                Open complaint detail
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
