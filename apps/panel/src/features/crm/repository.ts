import { mockCampaigns, mockCompanies, mockOpportunities } from "./mock-data";
import type { CampaignSummary, Company, Opportunity } from "./types";

export interface CrmRepository {
  listOpportunities(): Promise<Opportunity[]>;
  getOpportunity(id: string): Promise<Opportunity | null>;
  listCompanies(): Promise<Company[]>;
  listCampaigns(): Promise<CampaignSummary[]>;
}

export class MockCrmRepository implements CrmRepository {
  async listOpportunities(): Promise<Opportunity[]> {
    return structuredClone(mockOpportunities);
  }

  async getOpportunity(id: string): Promise<Opportunity | null> {
    const found = mockOpportunities.find((item) => item.id === id);
    return found ? structuredClone(found) : null;
  }

  async listCompanies(): Promise<Company[]> {
    return structuredClone(mockCompanies);
  }

  async listCampaigns(): Promise<CampaignSummary[]> {
    return structuredClone(mockCampaigns);
  }
}

export const crmRepository: CrmRepository = new MockCrmRepository();
