import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface PrometheusMetric {
  labels: { [key: string]: string };
  value: string;
  timestamp?: number;
}

export interface VisitorMetric extends PrometheusMetric {
  labels: {
    client_ip: string;
    domain: string;
    route: string;
    user_agent: string;
    country: string;
  };
}

export interface PrometheusData {
  visitor_requests_total?: PrometheusMetric[];
  http_requests_total?: PrometheusMetric[];
  [key: string]: PrometheusMetric[] | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private metricsUrl = '/metrics';

  constructor(private http: HttpClient) {}

  async getVisitorMetrics(): Promise<PrometheusData> {
    try {
      const metricsText = await firstValueFrom(
        this.http.get(this.metricsUrl, { responseType: 'text' })
      );
      
      return this.parsePrometheusMetrics(metricsText);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }
  }

  private parsePrometheusMetrics(metricsText: string): PrometheusData {
    const lines = metricsText.split('\n');
    const data: PrometheusData = {};
    
    let currentMetric = '';
    
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      if (line.trim() === '') continue;
      
      // Check if this is a metric we're interested in
      if (line.startsWith('visitor_requests_total{')) {
        currentMetric = 'visitor_requests_total';
        if (!data[currentMetric]) data[currentMetric] = [];
        
        const parsed = this.parseMetricLine(line);
        if (parsed && data[currentMetric]) {
          (data[currentMetric] as PrometheusMetric[]).push(parsed);
        }
      } else if (line.startsWith('http_requests_total{')) {
        currentMetric = 'http_requests_total';
        if (!data[currentMetric]) data[currentMetric] = [];
        
        const parsed = this.parseMetricLine(line);
        if (parsed && data[currentMetric]) {
          (data[currentMetric] as PrometheusMetric[]).push(parsed);
        }
      }
    }
    
    return data;
  }

  private parseMetricLine(line: string): PrometheusMetric | null {
    try {
      // Parse line format: metric_name{label1="value1",label2="value2"} value timestamp
      const metricMatch = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\{([^}]*)\}\s+([^\s]+)(?:\s+([^\s]+))?/);
      
      if (!metricMatch) return null;
      
      const [, metricName, labelsStr, value, timestamp] = metricMatch;
      
      // Parse labels
      const labels: { [key: string]: string } = {};
      const labelMatches = labelsStr.match(/([a-zA-Z_][a-zA-Z0-9_]*)="([^"]*?)"/g);
      
      if (labelMatches) {
        for (const labelMatch of labelMatches) {
          const labelParts = labelMatch.match(/([a-zA-Z_][a-zA-Z0-9_]*)="([^"]*?)"/);
          if (labelParts) {
            labels[labelParts[1]] = labelParts[2];
          }
        }
      }
      
      return {
        labels,
        value,
        timestamp: timestamp ? parseInt(timestamp) : undefined
      };
    } catch (error) {
      console.warn('Failed to parse metric line:', line, error);
      return null;
    }
  }

  async getMetricsHistory(hours: number = 24): Promise<PrometheusData> {
    // This would typically query a time-series database like Prometheus
    // For now, we'll return current metrics
    return this.getVisitorMetrics();
  }

  async getTopVisitors(limit: number = 10): Promise<Array<{ip: string, visits: number, domains: string[]}>> {
    const data = await this.getVisitorMetrics();
    const ipVisits: { [ip: string]: { visits: number, domains: Set<string> } } = {};
    
    if (data.visitor_requests_total) {
      data.visitor_requests_total.forEach(metric => {
        const ip = metric.labels['client_ip'];
        const domain = metric.labels['domain'];
        const visits = parseInt(metric.value);
        
        if (!ipVisits[ip]) {
          ipVisits[ip] = { visits: 0, domains: new Set() };
        }
        
        ipVisits[ip].visits += visits;
        ipVisits[ip].domains.add(domain);
      });
    }
    
    return Object.entries(ipVisits)
      .map(([ip, data]) => ({
        ip,
        visits: data.visits,
        domains: Array.from(data.domains)
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, limit);
  }
}