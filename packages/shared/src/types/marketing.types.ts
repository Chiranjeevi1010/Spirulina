import { PaginationQuery } from './common.types';

export interface DemoFarm {
  id: number;
  farmName: string;
  farmerName: string;
  location?: string;
  farmType?: string;
  areaAcres?: number;
  trialStartDate?: string;
  trialEndDate?: string;
  status: 'active' | 'completed' | 'cancelled';
  spirulinaDose?: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  roiPercentage?: number;
  notes?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDemoFarmRequest {
  farmName: string;
  farmerName: string;
  location?: string;
  farmType?: string;
  areaAcres?: number;
  trialStartDate?: string;
  trialEndDate?: string;
  spirulinaDose?: string;
  notes?: string;
}

export interface Testimonial {
  id: number;
  customerId?: number;
  demoFarmId?: number;
  content: string;
  rating?: number;
  mediaUrls: string[];
  isPublished: boolean;
  approvedBy?: number;
  createdAt: string;
}

export interface CreateTestimonialRequest {
  customerId?: number;
  demoFarmId?: number;
  content: string;
  rating?: number;
  mediaUrls?: string[];
}

export interface DemoFarmFilters extends PaginationQuery {
  status?: 'active' | 'completed' | 'cancelled';
  farmType?: string;
  search?: string;
}
