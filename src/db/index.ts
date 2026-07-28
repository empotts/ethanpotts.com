import { drizzle } from "drizzle-orm/d1";
import { env } from "@/env";
import * as schema from "./schema";

export const db = drizzle(env.DB, { schema });

export { schema };
