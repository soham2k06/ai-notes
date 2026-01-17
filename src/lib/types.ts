type CoreMessage = {
  id?: string;
  role: "user" | "model";
  content: string;
};
export type { CoreMessage };
