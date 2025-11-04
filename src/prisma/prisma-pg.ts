import { PrismaClient } from "./client-pg/client";
import safeMeasure from "../lib/measure";
import { QueryResult } from "../lib/types";
import { env } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

type Env = {
  DATABASE_URL: string;
};

let prismaClientInstance: PrismaClient | null = null;

export const getPrismaClient = () => {
  if (!prismaClientInstance) {
    const adapter = new PrismaPg({
      connectionString: env<Env>("DATABASE_URL"),
    });
    prismaClientInstance = new PrismaClient({ adapter });
  }
  return prismaClientInstance;
};

export async function prismaPg(databaseUrl: string): Promise<QueryResult[]> {
  console.log(`Run prisma benchmarks: `, databaseUrl);

  const prisma = getPrismaClient();

  // Ensure connection is established (this is idempotent)
  await prisma.$connect();

  const results: QueryResult[] = [];

  /**
   * findMany
   */

  const findManyResult = await safeMeasure(
    "prisma-findMany",
    prisma.customer.findMany()
  );
  if (findManyResult) results.push(findManyResult);

  const filterPaginateResult = await safeMeasure(
    "prisma-findMany-filter-paginate-order",
    prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      skip: 0,
      take: 10,
    })
  );
  if (filterPaginateResult) results.push(filterPaginateResult);

  const findManyNestingResult = await safeMeasure(
    "prisma-findMany-1-level-nesting",
    prisma.customer.findMany({
      include: {
        orders: true,
      },
    })
  );
  if (findManyNestingResult) results.push(findManyNestingResult);

  /**
   * findFirst
   */

  const findFirstResult = await safeMeasure(
    "prisma-findFirst",
    prisma.customer.findFirst()
  );
  if (findFirstResult) results.push(findFirstResult);

  const findFirstNestingResult = await safeMeasure(
    "prisma-findFirst-1-level-nesting",
    prisma.customer.findFirst({
      include: {
        orders: true,
      },
    })
  );
  if (findFirstNestingResult) results.push(findFirstNestingResult);

  /**
   * findUnique
   */

  const findUniqueResult = await safeMeasure(
    "prisma-findUnique",
    prisma.customer.findUnique({
      where: { id: 1 },
    })
  );
  if (findUniqueResult) results.push(findUniqueResult);

  const findUniqueNestingResult = await safeMeasure(
    "prisma-findUnique-1-level-nesting",
    prisma.customer.findUnique({
      where: { id: 1 },
      include: {
        orders: true,
      },
    })
  );
  if (findUniqueNestingResult) results.push(findUniqueNestingResult);

  /**
   * create
   */

  const createResult = await safeMeasure(
    "prisma-create",
    prisma.customer.create({
      data: {
        name: "John Doe",
        email: "john.doe@example.com",
      },
    })
  );
  if (createResult) results.push(createResult);

  const nestedCreateResult = await safeMeasure(
    "prisma-nested-create",
    prisma.customer.create({
      data: {
        name: "John Doe",
        email: "john.doe@example.com",
        isActive: false,
        orders: {
          create: {
            date: new Date(),
            totalAmount: 100.5,
            products: {
              connect: [{ id: 1 }, { id: 2 }], // Assuming products with IDs 1 and 2 already exist
            },
          },
        },
      },
    })
  );
  if (nestedCreateResult) results.push(nestedCreateResult);

  /**
   * update
   */

  const updateResult = await safeMeasure(
    "prisma-update",
    prisma.customer.update({
      where: { id: 1 },
      data: {
        name: "John Doe Updated",
      },
    })
  );
  if (updateResult) results.push(updateResult);

  const nestedUpdateResult = await safeMeasure(
    "prisma-nested-update",
    prisma.customer.update({
      where: { id: 1 },
      data: {
        name: "John Doe Updated",
        address: {
          update: {
            street: "456 New St",
          },
        },
      },
    })
  );
  if (nestedUpdateResult) results.push(nestedUpdateResult);

  /**
   * upsert
   */

  const upsertResult = await safeMeasure(
    "prisma-upsert",
    prisma.customer.upsert({
      where: { id: 1 },
      update: {
        name: "John Doe Upserted",
      },
      create: {
        name: "John Doe",
        email: "john.doe@example.com",
      },
    })
  );
  if (upsertResult) results.push(upsertResult);

  const nestedUpsertResult = await safeMeasure(
    "prisma-nested-upsert",
    prisma.customer.upsert({
      where: { id: 1 },
      update: {
        name: "John Doe Upserted",
        address: {
          update: {
            street: "456 New St",
          },
        },
      },
      create: {
        name: "John Doe",
        email: "john.doe@example.com",
        address: {
          create: {
            street: "456 New St",
            city: "Anytown",
            postalCode: "12345",
            country: "Country",
          },
        },
      },
    })
  );
  if (nestedUpsertResult) results.push(nestedUpsertResult);

  /**
   * delete
   */

  const deleteResult = await safeMeasure(
    "prisma-delete",
    prisma.customer.delete({
      where: { id: 1 },
    })
  );
  if (deleteResult) results.push(deleteResult);

  await prisma.$disconnect();

  return results;
}
