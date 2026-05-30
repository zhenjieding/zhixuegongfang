import { Router } from "express";
import { loginWithPassword, registerWithPassword } from "../services/authService";
import { HttpError } from "../utils/httpError";

export const authRouter = Router();

authRouter.post("/login", async (request, response, next) => {
  try {
    const account = String(request.body?.account ?? "").trim();
    const password = String(request.body?.password ?? "");

    if (!account || !password) {
      throw new HttpError(400, "请输入账号和密码。");
    }

    response.json(await loginWithPassword(account, password));
  } catch (error) {
    next(error);
  }
});

authRouter.post("/register", async (request, response, next) => {
  try {
    response.json(
      await registerWithPassword({
        account: String(request.body?.account ?? ""),
        password: String(request.body?.password ?? ""),
        displayName: String(request.body?.displayName ?? ""),
        role: String(request.body?.role ?? "student"),
      }),
    );
  } catch (error) {
    next(error);
  }
});

