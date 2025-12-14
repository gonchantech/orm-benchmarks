export const kyselySnippets = {
  "kysely-findMany": `
db.selectFrom("Customer").selectAll().execute()`,

  "kysely-findMany-filter-paginate-order": `
db.selectFrom("Customer")
  .selectAll("Customer")
  .where("isActive", "=", true)
  .orderBy("createdAt", "desc")
  .limit(10)
  .execute()`,

  "kysely-findMany-1-level-nesting": `
db.selectFrom("Customer")
  .selectAll("Customer")
  .select((eb) => [
    jsonArrayFrom(
      eb.selectFrom("Order")
        .selectAll()
        .whereRef("Order.customerId", "=", "Customer.id")
    ).as("orders")
  ])
  .execute()`,

  "kysely-findFirst": `
db.selectFrom("Customer")
  .selectAll("Customer")
  .limit(1)
  .execute()`,

  "kysely-findFirst-1-level-nesting": `
db.selectFrom("Customer")
  .selectAll("Customer")
  .select((eb) => [
    jsonArrayFrom(
      eb.selectFrom("Order")
        .selectAll()
        .whereRef("Order.customerId", "=", "Customer.id")
    ).as("orders")
  ])
  .limit(1)
  .execute()`,

  "kysely-findUnique": `
db.selectFrom("Customer")
  .selectAll("Customer")
  .where("id", "=", 1)
  .limit(1)
  .execute()`,

  "kysely-findUnique-1-level-nesting": `
db.selectFrom("Customer")
  .selectAll("Customer")
  .select((eb) => [
    jsonArrayFrom(
      eb.selectFrom("Order")
        .selectAll()
        .whereRef("Order.customerId", "=", "Customer.id")
    ).as("orders")
  ])
  .where("Customer.id", "=", 1)
  .limit(1)
  .execute()`,

  "kysely-create": `
db.insertInto("Customer")
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
  .execute()`,

  "kysely-nested-create": `
db.transaction().execute(async (trx) => {
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

  await trx
    .insertInto("_OrderProducts")
    .values([
      { A: orderId, B: 1 },
      { A: orderId, B: 2 },
    ])
    .execute();
})`,

  "kysely-update": `
db.updateTable("Customer")
  .set({ name: "John Doe Updated" })
  .where("id", "=", 1)`,

  "kysely-nested-update": `
db.transaction().execute(async (trx) => {
  await trx
    .updateTable("Customer")
    .set({ name: "John Doe Updated" })
    .where("id", "=", 1)
    .execute();

  await trx
    .updateTable("Address")
    .set({ street: "456 New St" })
    .where("customerId", "=", 1)
    .execute();
})`,

  "kysely-upsert": `
db.insertInto("Customer")
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
  .execute()`,

  "kysely-nested-upsert": `
db.transaction().execute(async (trx) => {
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
})`,

  "kysely-delete": `
db.deleteFrom("Customer").where("id", "=", 1)`,
};
