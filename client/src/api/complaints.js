import { http } from "./http";

function unwrapResponse(response) {
  if (!response?.data) {
    throw new Error("Empty server response");
  }

  if (response.data.success === false) {
    throw new Error(response.data.message || "Request failed");
  }

  return response.data;
}

function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== "" && value !== undefined && value !== null
    )
  );
}

export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await http.post("/uploads/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  const payload = unwrapResponse(response);
  return payload.data;
}

export async function createComplaint(input) {
  const response = await http.post("/complaints", input);
  const payload = unwrapResponse(response);
  return payload.data;
}

export async function fetchComplaints(params = {}) {
  const response = await http.get("/complaints", { params: cleanParams(params) });
  const payload = unwrapResponse(response);
  return {
    items: payload.data || [],
    meta: payload.meta || { page: 1, limit: 20, total: 0, totalPages: 1 }
  };
}

export async function fetchComplaintById(id) {
  const response = await http.get(`/complaints/${id}`);
  const payload = unwrapResponse(response);
  return payload.data;
}

export async function patchComplaintStatus(id, status) {
  const response = await http.patch(`/complaints/${id}/status`, { status });
  const payload = unwrapResponse(response);
  return payload.data;
}

export async function verifyComplaint(id, input) {
  const response = await http.post(`/complaints/${id}/verify`, input);
  const payload = unwrapResponse(response);
  return payload.data;
}

export async function submitWorkerProgress(id, input) {
  const response = await http.post(`/complaints/${id}/progress`, input);
  const payload = unwrapResponse(response);
  return payload.data;
}

export async function fetchImpactOverview(params = {}) {
  const response = await http.get("/insights/overview", { params: cleanParams(params) });
  const payload = unwrapResponse(response);
  return payload.data;
}
