import { relations } from 'drizzle-orm';
import {
  roles,
  users,
  refreshTokens,
  ponds,
  waterParameters,
  harvests,
  production,
  chemicals,
  chemicalUsage,
  expenseCategories,
  expenses,
  customers,
  leads,
  orders,
  orderItems,
  batches,
  batchTests,
  inventory,
  demoFarms,
  testimonials,
  aiConversations,
  aiAlerts,
  settings,
} from '../schema/index.js';

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  refreshTokens: many(refreshTokens),
  aiConversations: many(aiConversations),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

export const pondsRelations = relations(ponds, ({ many }) => ({
  waterParameters: many(waterParameters),
  harvests: many(harvests),
  chemicalUsage: many(chemicalUsage),
  aiAlerts: many(aiAlerts),
}));

export const waterParametersRelations = relations(waterParameters, ({ one }) => ({
  pond: one(ponds, { fields: [waterParameters.pondId], references: [ponds.id] }),
}));

export const harvestsRelations = relations(harvests, ({ one, many }) => ({
  pond: one(ponds, { fields: [harvests.pondId], references: [ponds.id] }),
  production: many(production),
}));

export const productionRelations = relations(production, ({ one }) => ({
  harvest: one(harvests, { fields: [production.harvestId], references: [harvests.id] }),
  batch: one(batches, { fields: [production.batchId], references: [batches.id] }),
}));

export const chemicalsRelations = relations(chemicals, ({ many }) => ({
  usage: many(chemicalUsage),
}));

export const chemicalUsageRelations = relations(chemicalUsage, ({ one }) => ({
  chemical: one(chemicals, { fields: [chemicalUsage.chemicalId], references: [chemicals.id] }),
  pond: one(ponds, { fields: [chemicalUsage.pondId], references: [ponds.id] }),
}));

export const expenseCategoriesRelations = relations(expenseCategories, ({ many }) => ({
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  category: one(expenseCategories, { fields: [expenses.categoryId], references: [expenseCategories.id] }),
  pond: one(ponds, { fields: [expenses.pondId], references: [ponds.id] }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  testimonials: many(testimonials),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  convertedCustomer: one(customers, { fields: [leads.convertedToCustomerId], references: [customers.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  batch: one(batches, { fields: [orderItems.batchId], references: [batches.id] }),
}));

export const batchesRelations = relations(batches, ({ one, many }) => ({
  sourcePond: one(ponds, { fields: [batches.sourcePondId], references: [ponds.id] }),
  tests: many(batchTests),
  orderItems: many(orderItems),
}));

export const batchTestsRelations = relations(batchTests, ({ one }) => ({
  batch: one(batches, { fields: [batchTests.batchId], references: [batches.id] }),
}));

export const demoFarmsRelations = relations(demoFarms, ({ many }) => ({
  testimonials: many(testimonials),
}));

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  customer: one(customers, { fields: [testimonials.customerId], references: [customers.id] }),
  demoFarm: one(demoFarms, { fields: [testimonials.demoFarmId], references: [demoFarms.id] }),
}));

export const aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  user: one(users, { fields: [aiConversations.userId], references: [users.id] }),
  pond: one(ponds, { fields: [aiConversations.contextPondId], references: [ponds.id] }),
}));

export const aiAlertsRelations = relations(aiAlerts, ({ one }) => ({
  pond: one(ponds, { fields: [aiAlerts.pondId], references: [ponds.id] }),
}));
