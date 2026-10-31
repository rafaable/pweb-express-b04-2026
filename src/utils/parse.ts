import { HttpError } from "./http-error";

export const parseId = (value: unknown): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "ID harus berupa bilangan bulat positif");
  }
  return id;
};
