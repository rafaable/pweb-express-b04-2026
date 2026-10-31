import type { Response } from "express";

export const sendSuccess = (
  res: Response,
  status: number,
  message: string,
  data?: unknown,
  metadata?: Record<string, unknown>,
): void => {
  const payload: Record<string, unknown> = {
    status: true,
    message,
  };
  if (data !== undefined) {
    payload.data = data;
  }
  if (metadata !== undefined) {
    payload.metadata = metadata;
  }
  res.status(status).json(payload);
};
