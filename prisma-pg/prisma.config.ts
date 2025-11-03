import "dotenv/config";
import { defineConfig, env } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

type Env = {
  DATABASE_URL: string;
};

export default defineConfig({
  experimental: {
    adapter: true,
  },
  datasource: {
    url: env<Env>("DATABASE_URL"),
  },
  schema: "./schema.prisma",
  async adapter() {
    return new PrismaPg({
      connectionString: env<Env>("DATABASE_URL"),
    });
  },
});
