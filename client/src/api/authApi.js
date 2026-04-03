import { http } from "./http";

export async function loginAdmin(password) {
  const { data } = await http.post("/auth/login", { password });
  return data;
}
