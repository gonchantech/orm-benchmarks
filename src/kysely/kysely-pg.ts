import { Kysely, PostgresDialect, sql } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import pg from "pg";
const { Pool } = pg;
import { QueryResult } from "../lib/types";
import { DB } from "./type/schema-postgres";
import safeMeasure from "../lib/measure";

export async function kyselyPg(databaseUrl: string): Promise<QueryResult[]> {
  const dialect = new PostgresDialect({
    pool: new Pool({
      connectionString: databaseUrl,
    }),
  });

  const db = new Kysely<DB>({
    dialect,
  });

  console.log(`Run kysely benchmarks: `, databaseUrl);

  const results: QueryResult[] = [];

  /**
   * findMany
   */

  const findManyResult = await safeMeasure(
    "kysely-findMany",
    db.selectFrom("Customer").selectAll().execute()
  );
  if (findManyResult) results.push(findManyResult);

  const filterPaginateResult = await safeMeasure(
    "kysely-findMany-filter-paginate-order",
    db
      .selectFrom("Customer")
      .selectAll("Customer")
      .where("isActive", "=", true)
      .orderBy("createdAt", "desc")
      .limit(10)
      .execute()
  );
  if (filterPaginateResult) results.push(filterPaginateResult);

  const findManyNestingResult = await safeMeasure(
    "kysely-findMany-1-level-nesting",
    db
      .selectFrom("Customer")
      .selectAll("Customer")
      .select((eb) => [
        jsonArrayFrom(
          eb
            .selectFrom("Order")
            .selectAll()
            .whereRef("Order.customerId", "=", "Customer.id")
        ).as("orders"),
      ])
      .execute()
  );
  if (findManyNestingResult) results.push(findManyNestingResult);

  /**
   * findFirst
   */

  const findFirstResult = await safeMeasure(
    "kysely-findFirst",
    db.selectFrom("Customer").selectAll("Customer").limit(1).execute()
  );
  if (findFirstResult) results.push(findFirstResult);

  const findFirstNestingResult = await safeMeasure(
    "kysely-findFirst-1-level-nesting",
    db
      .selectFrom("Customer")
      .selectAll("Customer")
      .select((eb) => [
        jsonArrayFrom(
          eb
            .selectFrom("Order")
            .selectAll()
            .whereRef("Order.customerId", "=", "Customer.id")
        ).as("orders"),
      ])
      .limit(1)
      .execute()
  );
  if (findFirstNestingResult) results.push(findFirstNestingResult);

  /**
   * findUnique
   */

  const findUniqueResult = await safeMeasure(
    "kysely-findUnique",
    db
      .selectFrom("Customer")
      .selectAll("Customer")
      .where("id", "=", 1)
      .limit(1)
      .execute()
  );
  if (findUniqueResult) results.push(findUniqueResult);

  const findUniqueNestingResult = await safeMeasure(
    "kysely-findUnique-1-level-nesting",
    db
      .selectFrom("Customer")
      .selectAll("Customer")
      .select((eb) => [
        jsonArrayFrom(
          eb
            .selectFrom("Order")
            .selectAll()
            .whereRef("Order.customerId", "=", "Customer.id")
        ).as("orders"),
      ])
      .where("Customer.id", "=", 1)
      .limit(1)
      .execute()
  );
  if (findUniqueNestingResult) results.push(findUniqueNestingResult);

  /**
   * create
   */

  const createResult = await safeMeasure(
    "kysely-create",
    db
      .insertInto("Customer")
      .values({
        name: "John Doe",
        email: "john.doe@example.com",
        isActive: false,
      })
      .returning([
        "Customer.id",
        "Customer.name",
        "Customer.email",
        "Customer.isActive",
      ])
      .execute()
  );
  if (createResult) results.push(createResult);

  const nestedCreate = db.transaction().execute(async (trx) => {
    // Insert customer
    const customers = await trx
      .insertInto("Customer")
      .values({
        name: "John Doe",
        email: "john.doe@example.com",
        isActive: false,
      })
      .returning([
        "Customer.id",
        "Customer.name",
        "Customer.email",
        "Customer.isActive",
      ])
      .execute();

    const customerId = customers[0].id;

    // Insert order with the associated customerId
    const insertedOrders = await trx
      .insertInto("Order")
      .values({
        customerId: customerId,
        date: new Date(),
        totalAmount: 100.5,
      })
      .returning(["Order.id"])
      .execute();

    const orderId = insertedOrders[0].id;

    // Insert products with the associated orderId
    await trx
      .insertInto("_OrderProducts")
      .values([
        {
          A: orderId,
          B: 1,
        },
        {
          A: orderId,
          B: 2,
        },
      ])
      .execute();
  });
  const nestedCreateResult = await safeMeasure(
    "kysely-nested-create",
    nestedCreate
  );
  if (nestedCreateResult) results.push(nestedCreateResult);

  /**
   * update
   */

  const updateResult = await safeMeasure(
    "kysely-update",
    db
      .updateTable("Customer")
      .set({ name: "John Doe Updated" })
      .where("id", "=", 1)
      .execute()
  );
  if (updateResult) results.push(updateResult);

  const nestedUpdateResult = await safeMeasure(
    "kysely-nested-update",
    db.transaction().execute(async (trx) => {
      // Update customer name
      await trx
        .updateTable("Customer")
        .set({ name: "John Doe Updated" })
        .where("id", "=", 1)
        .execute();

      // Update address
      await trx
        .updateTable("Address")
        .set({
          street: "456 New St",
        })
        .where("customerId", "=", 1)
        .execute();
    })
  );
  if (nestedUpdateResult) results.push(nestedUpdateResult);

  /**
   * upsert
   */

  const upsertResult = await safeMeasure(
    "kysely-upsert",
    db
      .insertInto("Customer")
      .values({
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        isActive: false,
      })
      .onConflict((oc) =>
        oc.column("id").doUpdateSet({
          name: "John Doe Upserted",
        })
      )
      .execute()
  );
  if (upsertResult) results.push(upsertResult);

  const nestedUpsert = db.transaction().execute(async (trx) => {
    // Update customer name
    const customer = await trx
      .insertInto("Customer")
      .values({
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        isActive: false,
      })
      .onConflict((oc) =>
        oc.column("id").doUpdateSet({ name: "John Doe Upserted" })
      )
      .returning([
        "Customer.id",
        "Customer.name",
        "Customer.email",
        "Customer.isActive",
      ])
      .execute();
    const customerId = customer[0].id;

    // Update address
    await trx
      .insertInto("Address")
      .values({
        street: "456 New St",
        city: "Anytown",
        postalCode: "12345",
        country: "Country",
        customerId: customerId,
      })
      .onConflict((oc) =>
        oc.column("customerId").doUpdateSet({ street: "456 New St" })
      )
      .execute();
  });
  const nestedUpsertResult = await safeMeasure(
    "kysely-nested-upsert",
    nestedUpsert
  );
  if (nestedUpsertResult) results.push(nestedUpsertResult);

  /**
   * delete
   */

  const deleteResult = await safeMeasure(
    "kysely-delete",
    db.deleteFrom("Customer").where("id", "=", 1).execute()
  );
  if (deleteResult) results.push(deleteResult);

  return results;
}
