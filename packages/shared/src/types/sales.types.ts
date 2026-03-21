import {
  CustomerType,
  LeadSource,
  LeadStatus,
  OrderStatus,
  PaymentStatus,
  ProductType,
  PaginationQuery,
  DateRangeQuery,
} from './common.types';

export interface Customer {
  id: number;
  companyName?: string;
  contactName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  customerType: CustomerType;
  creditDays: number;
  creditLimit: number;
  outstandingAmount: number;
  gstNumber?: string;
  notes?: string;
  isActive: boolean;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  companyName?: string;
  contactName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  customerType: CustomerType;
  creditDays?: number;
  creditLimit?: number;
  gstNumber?: string;
  notes?: string;
}

export interface Lead {
  id: number;
  contactName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  leadSource?: LeadSource;
  customerType?: CustomerType;
  status: LeadStatus;
  estimatedValue?: number;
  nextFollowUp?: string;
  notes?: string;
  convertedToCustomerId?: number;
  assignedTo?: number;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadRequest {
  contactName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  leadSource?: LeadSource;
  customerType?: CustomerType;
  estimatedValue?: number;
  nextFollowUp?: string;
  notes?: string;
  assignedTo?: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customer?: Customer;
  orderDate: string;
  deliveryDate?: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentDueDate?: string;
  paymentReceived: number;
  shippingAddress?: string;
  notes?: string;
  items?: OrderItem[];
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productType: ProductType;
  batchId?: number;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
}

export interface CreateOrderRequest {
  customerId: number;
  orderDate: string;
  deliveryDate?: string;
  shippingAddress?: string;
  taxAmount?: number;
  discountAmount?: number;
  notes?: string;
  items: CreateOrderItemRequest[];
}

export interface CreateOrderItemRequest {
  productType: ProductType;
  batchId?: number;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface CustomerFilters extends PaginationQuery {
  customerType?: CustomerType;
  isActive?: boolean;
  search?: string;
}

export interface LeadFilters extends PaginationQuery {
  status?: LeadStatus;
  leadSource?: LeadSource;
  assignedTo?: number;
  search?: string;
}

export interface OrderFilters extends PaginationQuery, DateRangeQuery {
  customerId?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

export interface RevenueMetrics {
  dailyRevenue: number;
  monthlyRevenue: number;
  totalRevenue: number;
  marginPerClient: { customerId: number; customerName: string; margin: number }[];
  repeatCustomerRate: number;
}
