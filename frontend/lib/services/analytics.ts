import { api } from '@/lib/services/api'

export interface RiskFactorData {
  factor: string;
  pacientes: number;
  porcentaje: number;
  color: string;
}

export interface AgeDistributionData {
  rango: string;
  bajo: number;
  medio: number;
  alto: number;
}

export interface RiskDistributionData {
  name: string;
  value: number;
  color: string;
}

export interface MonthlyPredictionData {
  mes: string;
  predicciones: number;
  precision: number;
}

export interface DashboardMetrics {
  total_patients: number;
  total_predictions: number;
  high_risk_count: number;
  monthly_growth: number;
  risk_distribution: Array<{ riesgo_nivel: string; count: number }>;
  age_risk_distribution: Array<{
    rango: string;
    bajo: number;
    medio: number;
    alto: number;
  }>;
  common_risk_factors: Array<{
    factor: string;
    pacientes: number;
    porcentaje: number;
  }>;
  monthly_evolution: Array<{
    mes: string;
    predicciones: number;
    precision: number;
  }>;
  model_accuracy: number;
}

class AnalyticsService {
  private metrics: DashboardMetrics | null = null;

  private async ensureMetrics(): Promise<DashboardMetrics> {
    if (!this.metrics) {
      const response = await api.get<DashboardMetrics>("/api/analytics/dashboard_metrics/");
      this.metrics = response.data;
    }
    return this.metrics;
  }

  async getRiskFactors(): Promise<RiskFactorData[]> {
    const metrics = await this.ensureMetrics();
    return metrics.common_risk_factors.map(factor => ({
      ...factor,
      color: this.getColorForFactor(factor.factor)
    }));
  }

  async getAgeDistribution(): Promise<AgeDistributionData[]> {
    const metrics = await this.ensureMetrics();
    return metrics.age_risk_distribution;
  }

  async getRiskDistribution(): Promise<RiskDistributionData[]> {
    const metrics = await this.ensureMetrics();
    return metrics.risk_distribution.map(dist => ({
      name: dist.riesgo_nivel,
      value: dist.count,
      color: this.getColorForRisk(dist.riesgo_nivel)
    }));
  }

  async getMonthlyPredictions(): Promise<MonthlyPredictionData[]> {
    const metrics = await this.ensureMetrics();
    return metrics.monthly_evolution;
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.ensureMetrics();
  }

  private getColorForFactor(factor: string): string {
    const colors: { [key: string]: string } = {
      'IMC Elevado': '#FF6B6B',
      'Hipertensión': '#4ECDC4',
      'Tabaquismo': '#45B7D1',
      'Sedentarismo': '#96CEB4'
    };
    return colors[factor] || '#808080';
  }

  private getColorForRisk(risk: string): string {
    const colors: { [key: string]: string } = {
      'Bajo': '#4CAF50',
      'Medio': '#FFC107',
      'Alto': '#F44336'
    };
    return colors[risk] || '#808080';
  }
}

export const analyticsService = new AnalyticsService(); 