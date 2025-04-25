import { z } from "zod";

export const zUser = z.object({
  username: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  iconUrl: z.string().nullable(),
  roles: z.array(z.string()),
});

export type User = z.infer<typeof zUser>;
