import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
const { Pool } = pg;
import { QueryResult } from "../lib/types";
import { DB } from "./type/schema-postgres";
import safeMeasure from "../lib/measure";

export async function additionalKyselyPg(
  databaseUrl: string
): Promise<QueryResult[]> {
  const dialect = new PostgresDialect({
    pool: new Pool({
      connectionString: databaseUrl,
    }),
  });

  const db = new Kysely<DB>({
    dialect,
  });

  console.log(`Run additional kysely benchmarks: `, databaseUrl);

  const results: QueryResult[] = [];

  /**
   * Two separate queries approach (without jsonArrayFrom)
   * 1. Fetch all customers
   * 2. Fetch all orders
   * 3. Merge in memory
   */
  const twoQueriesResult = await safeMeasure(
    "kysely-findMany-1-level-nesting-two-queries",
    (async () => {
      // Query 1: Get all customers
      const customers = await db
        .selectFrom("Customer")
        .selectAll("Customer")
        .execute();

      // Query 2: Get all orders
      const orders = await db.selectFrom("Order").selectAll("Order").execute();

      // Merge in memory
      const ordersByCustomerId = new Map<number, (typeof orders)[number][]>();
      for (const order of orders) {
        const customerId = order.customerId;
        if (!ordersByCustomerId.has(customerId)) {
          ordersByCustomerId.set(customerId, []);
        }
        ordersByCustomerId.get(customerId)!.push(order);
      }

      return customers.map((customer) => ({
        ...customer,
        orders: ordersByCustomerId.get(customer.id) ?? [],
      }));
    })()
  );
  if (twoQueriesResult) results.push(twoQueriesResult);

  /**
   * JOIN approach
   * Use LEFT JOIN and manually group the results in memory
   */
  const joinResult = await safeMeasure(
    "kysely-findMany-1-level-nesting-join",
    (async () => {
      // Use LEFT JOIN to get customers with orders
      const rows = await db
        .selectFrom("Customer")
        .leftJoin("Order", "Order.customerId", "Customer.id")
        .select([
          "Customer.id as customerId",
          "Customer.name as customerName",
          "Customer.email as customerEmail",
          "Customer.isActive as customerIsActive",
          "Customer.createdAt as customerCreatedAt",
          "Order.id as orderId",
          "Order.customerId as orderCustomerId",
          "Order.date as orderDate",
          "Order.totalAmount as orderTotalAmount",
        ])
        .execute();

      // Group results in memory
      const customersMap = new Map<
        number,
        {
          id: number;
          name: string;
          email: string;
          isActive: boolean;
          createdAt: Date;
          orders: {
            id: number;
            customerId: number;
            date: Date;
            totalAmount: string;
          }[];
        }
      >();

      for (const row of rows) {
        if (!customersMap.has(row.customerId)) {
          customersMap.set(row.customerId, {
            id: row.customerId,
            name: row.customerName!,
            email: row.customerEmail,
            isActive: row.customerIsActive,
            createdAt: row.customerCreatedAt,
            orders: [],
          });
        }

        // Add order if it exists (LEFT JOIN can return null for orders)
        if (row.orderId !== null) {
          customersMap.get(row.customerId)!.orders.push({
            id: row.orderId,
            customerId: row.orderCustomerId!,
            date: row.orderDate!,
            totalAmount: `${row.orderTotalAmount!}`,
          });
        }
      }

      return Array.from(customersMap.values());
    })()
  );
  if (joinResult) results.push(joinResult);

  return results;
}
