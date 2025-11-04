// src/entity/Customer.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import type { Order } from "./Order";
import type { Address } from "./Address";

@Entity("Customer")
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  // sqlite
  // @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  // postgres
  @Column({
    name: "createdAt",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column({ nullable: true })
  name: string;

  @Column()
  email: string;

  @Column({ name: "isActive", default: false })
  isActive: boolean;

  @OneToMany("Order", "customer")
  orders: Order[];

  @OneToMany("Address", "customer")
  addresses: Address[];
}
