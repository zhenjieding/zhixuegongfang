export type UserRole = "student" | "teacher" | "admin";

export interface AuthenticatedUser {
  id: string;
  account: string;
  role: UserRole;
  displayName: string;
}

export interface LoginResponse {
  token: string;
  role: UserRole;
  account: string;
  displayName: string;
}

