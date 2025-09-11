import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { AnalyticsService } from '../../services/analytics.service';

Chart.register(...registerables);

interface VisitorData {
  ip: string;
  domain: string;
  route: string;
  visits: number;
  userAgent: string;
  lastVisit: Date;
  country: string;
  flag: string;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatTabsModule,
    MatButtonModule,
    BaseChartDirective
  ],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent implements OnInit {
  visitorData: VisitorData[] = [];
  loading = true;
  error = '';

  // Chart configurations
  public visitorsByIpChart: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Visits',
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };

  public visitorsByDomainChart: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 205, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)'
      ]
    }]
  };

  public visitorsByRouteChart: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(255, 159, 64, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 205, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)'
      ]
    }]
  };

  public visitorsByCountryChart: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)'
      ]
    }]
  };

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  public pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      }
    }
  };

  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      }
    }
  };

  public barChartType = 'bar' as const;
  public pieChartType = 'pie' as const;
  public doughnutChartType = 'doughnut' as const;

  displayedColumns: string[] = ['country', 'ip', 'domain', 'route', 'visits', 'userAgent', 'lastVisit'];

  constructor(private analyticsService: AnalyticsService) {}

  private getCountryFlag(countryCode: string): string {
    // Complete ISO 3166-1 alpha-2 country code to flag emoji mapping
    const flagMap: { [key: string]: string } = {
      // Special cases
      'LOCAL': '🏠', 'UN': '🌍',
      
      // A
      'AD': '🇦🇩', 'AE': '🇦🇪', 'AF': '🇦🇫', 'AG': '🇦🇬', 'AI': '🇦🇮', 'AL': '🇦🇱', 'AM': '🇦🇲', 'AO': '🇦🇴',
      'AQ': '🇦🇶', 'AR': '🇦🇷', 'AS': '🇦🇸', 'AT': '🇦🇹', 'AU': '🇦🇺', 'AW': '🇦🇼', 'AX': '🇦🇽', 'AZ': '🇦🇿',
      
      // B
      'BA': '🇧🇦', 'BB': '🇧🇧', 'BD': '🇧🇩', 'BE': '🇧🇪', 'BF': '🇧🇫', 'BG': '🇧🇬', 'BH': '🇧🇭', 'BI': '🇧🇮',
      'BJ': '🇧🇯', 'BL': '🇧🇱', 'BM': '🇧🇲', 'BN': '🇧🇳', 'BO': '🇧🇴', 'BQ': '🇧🇶', 'BR': '🇧🇷', 'BS': '🇧🇸',
      'BT': '🇧🇹', 'BV': '🇧🇻', 'BW': '🇧🇼', 'BY': '🇧🇾', 'BZ': '🇧🇿',
      
      // C
      'CA': '🇨🇦', 'CC': '🇨🇨', 'CD': '🇨🇩', 'CF': '🇨🇫', 'CG': '🇨🇬', 'CH': '🇨🇭', 'CI': '🇨🇮', 'CK': '🇨🇰',
      'CL': '🇨🇱', 'CM': '🇨🇲', 'CN': '🇨🇳', 'CO': '🇨🇴', 'CR': '🇨🇷', 'CU': '🇨🇺', 'CV': '🇨🇻', 'CW': '🇨🇼',
      'CX': '🇨🇽', 'CY': '🇨🇾', 'CZ': '🇨🇿',
      
      // D
      'DE': '🇩🇪', 'DJ': '🇩🇯', 'DK': '🇩🇰', 'DM': '🇩🇲', 'DO': '🇩🇴', 'DZ': '🇩🇿',
      
      // E
      'EC': '🇪🇨', 'EE': '🇪🇪', 'EG': '🇪🇬', 'EH': '🇪🇭', 'ER': '🇪🇷', 'ES': '🇪🇸', 'ET': '🇪🇹',
      
      // F
      'FI': '🇫🇮', 'FJ': '🇫🇯', 'FK': '🇫🇰', 'FM': '🇫🇲', 'FO': '🇫🇴', 'FR': '🇫🇷',
      
      // G
      'GA': '🇬🇦', 'GB': '🇬🇧', 'GD': '🇬🇩', 'GE': '🇬🇪', 'GF': '🇬🇫', 'GG': '🇬🇬', 'GH': '🇬🇭', 'GI': '🇬🇮',
      'GL': '🇬🇱', 'GM': '🇬🇲', 'GN': '🇬🇳', 'GP': '🇬🇵', 'GQ': '🇬🇶', 'GR': '🇬🇷', 'GS': '🇬🇸', 'GT': '🇬🇹',
      'GU': '🇬🇺', 'GW': '🇬🇼', 'GY': '🇬🇾',
      
      // H
      'HK': '🇭🇰', 'HM': '🇭🇲', 'HN': '🇭🇳', 'HR': '🇭🇷', 'HT': '🇭🇹', 'HU': '🇭🇺',
      
      // I
      'ID': '🇮🇩', 'IE': '🇮🇪', 'IL': '🇮🇱', 'IM': '🇮🇲', 'IN': '🇮🇳', 'IO': '🇮🇴', 'IQ': '🇮🇶', 'IR': '🇮🇷',
      'IS': '🇮🇸', 'IT': '🇮🇹',
      
      // J
      'JE': '🇯🇪', 'JM': '🇯🇲', 'JO': '🇯🇴', 'JP': '🇯🇵',
      
      // K
      'KE': '🇰🇪', 'KG': '🇰🇬', 'KH': '🇰🇭', 'KI': '🇰🇮', 'KM': '🇰🇲', 'KN': '🇰🇳', 'KP': '🇰🇵', 'KR': '🇰🇷',
      'KW': '🇰🇼', 'KY': '🇰🇾', 'KZ': '🇰🇿',
      
      // L
      'LA': '🇱🇦', 'LB': '🇱🇧', 'LC': '🇱🇨', 'LI': '🇱🇮', 'LK': '🇱🇰', 'LR': '🇱🇷', 'LS': '🇱🇸', 'LT': '🇱🇹',
      'LU': '🇱🇺', 'LV': '🇱🇻', 'LY': '🇱🇾',
      
      // M
      'MA': '🇲🇦', 'MC': '🇲🇨', 'MD': '🇲🇩', 'ME': '🇲🇪', 'MF': '🇲🇫', 'MG': '🇲🇬', 'MH': '🇲🇭', 'MK': '🇲🇰',
      'ML': '🇲🇱', 'MM': '🇲🇲', 'MN': '🇲🇳', 'MO': '🇲🇴', 'MP': '🇲🇵', 'MQ': '🇲🇶', 'MR': '🇲🇷', 'MS': '🇲🇸',
      'MT': '🇲🇹', 'MU': '🇲🇺', 'MV': '🇲🇻', 'MW': '🇲🇼', 'MX': '🇲🇽', 'MY': '🇲🇾', 'MZ': '🇲🇿',
      
      // N
      'NA': '🇳🇦', 'NC': '🇳🇨', 'NE': '🇳🇪', 'NF': '🇳🇫', 'NG': '🇳🇬', 'NI': '🇳🇮', 'NL': '🇳🇱', 'NO': '🇳🇴',
      'NP': '🇳🇵', 'NR': '🇳🇷', 'NU': '🇳🇺', 'NZ': '🇳🇿',
      
      // O
      'OM': '🇴🇲',
      
      // P
      'PA': '🇵🇦', 'PE': '🇵🇪', 'PF': '🇵🇫', 'PG': '🇵🇬', 'PH': '🇵🇭', 'PK': '🇵🇰', 'PL': '🇵🇱', 'PM': '🇵🇲',
      'PN': '🇵🇳', 'PR': '🇵🇷', 'PS': '🇵🇸', 'PT': '🇵🇹', 'PW': '🇵🇼', 'PY': '🇵🇾',
      
      // Q
      'QA': '🇶🇦',
      
      // R
      'RE': '🇷🇪', 'RO': '🇷🇴', 'RS': '🇷🇸', 'RU': '🇷🇺', 'RW': '🇷🇼',
      
      // S
      'SA': '🇸🇦', 'SB': '🇸🇧', 'SC': '🇸🇨', 'SD': '🇸🇩', 'SE': '🇸🇪', 'SG': '🇸🇬', 'SH': '🇸🇭', 'SI': '🇸🇮',
      'SJ': '🇸🇯', 'SK': '🇸🇰', 'SL': '🇸🇱', 'SM': '🇸🇲', 'SN': '🇸🇳', 'SO': '🇸🇴', 'SR': '🇸🇷', 'SS': '🇸🇸',
      'ST': '🇸🇹', 'SV': '🇸🇻', 'SX': '🇸🇽', 'SY': '🇸🇾', 'SZ': '🇸🇿',
      
      // T
      'TC': '🇹🇨', 'TD': '🇹🇩', 'TF': '🇹🇫', 'TG': '🇹🇬', 'TH': '🇹🇭', 'TJ': '🇹🇯', 'TK': '🇹🇰', 'TL': '🇹🇱',
      'TM': '🇹🇲', 'TN': '🇹🇳', 'TO': '🇹🇴', 'TR': '🇹🇷', 'TT': '🇹🇹', 'TV': '🇹🇻', 'TW': '🇹🇼', 'TZ': '🇹🇿',
      
      // U
      'UA': '🇺🇦', 'UG': '🇺🇬', 'UM': '🇺🇲', 'US': '🇺🇸', 'UY': '🇺🇾', 'UZ': '🇺🇿',
      
      // V
      'VA': '🇻🇦', 'VC': '🇻🇨', 'VE': '🇻🇪', 'VG': '🇻🇬', 'VI': '🇻🇮', 'VN': '🇻🇳', 'VU': '🇻🇺',
      
      // W
      'WF': '🇼🇫', 'WS': '🇼🇸',
      
      // Y
      'YE': '🇾🇪', 'YT': '🇾🇹',
      
      // Z
      'ZA': '🇿🇦', 'ZM': '🇿🇲', 'ZW': '🇿🇼'
    };
    
    return flagMap[countryCode.toUpperCase()] || '🌍';
  }

  async ngOnInit() {
    await this.loadAnalyticsData();
  }

  async loadAnalyticsData() {
    try {
      this.loading = true;
      this.error = '';
      
      const data = await this.analyticsService.getVisitorMetrics();
      this.processVisitorData(data);
      
    } catch (error) {
      this.error = 'Failed to load analytics data. Please try again later.';
      console.error('Analytics loading error:', error);
    } finally {
      this.loading = false;
    }
  }

  private processVisitorData(rawData: any) {
    // Process the Prometheus metrics data
    this.visitorData = this.parsePrometheusData(rawData);
    
    // Update charts
    this.updateVisitorsByIpChart();
    this.updateVisitorsByDomainChart();
    this.updateVisitorsByRouteChart();
    this.updateVisitorsByCountryChart();
  }

  private parsePrometheusData(data: any): VisitorData[] {
    // Parse the visitor_requests_total metrics
    const visitors: { [key: string]: VisitorData } = {};
    
    if (data.visitor_requests_total) {
      data.visitor_requests_total.forEach((metric: any) => {
        const client_ip = metric.labels['client_ip'];
        const domain = metric.labels['domain'];
        const route = metric.labels['route'];
        const user_agent = metric.labels['user_agent'];
        const country = metric.labels['country'] || 'Unknown';
        const visits = parseInt(metric.value);
        const key = `${client_ip}-${domain}-${route}`;
        
        if (!visitors[key]) {
          visitors[key] = {
            ip: client_ip,
            domain: domain,
            route: route,
            visits: 0,
            userAgent: user_agent,
            lastVisit: new Date(),
            country: country,
            flag: this.getCountryFlag(country)
          };
        }
        
        visitors[key].visits += visits;
      });
    }
    
    return Object.values(visitors).sort((a, b) => b.visits - a.visits);
  }

  private updateVisitorsByIpChart() {
    const ipVisits: { [key: string]: number } = {};
    
    this.visitorData.forEach(visitor => {
      ipVisits[visitor.ip] = (ipVisits[visitor.ip] || 0) + visitor.visits;
    });

    const sortedIps = Object.entries(ipVisits)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20); // Top 20 IPs

    this.visitorsByIpChart.labels = sortedIps.map(([ip]) => ip);
    this.visitorsByIpChart.datasets[0].data = sortedIps.map(([,visits]) => visits);
  }

  private updateVisitorsByDomainChart() {
    const domainVisits: { [key: string]: number } = {};
    
    this.visitorData.forEach(visitor => {
      domainVisits[visitor.domain] = (domainVisits[visitor.domain] || 0) + visitor.visits;
    });

    this.visitorsByDomainChart.labels = Object.keys(domainVisits);
    this.visitorsByDomainChart.datasets[0].data = Object.values(domainVisits);
  }

  private updateVisitorsByRouteChart() {
    const routeVisits: { [key: string]: number } = {};
    
    this.visitorData.forEach(visitor => {
      routeVisits[visitor.route] = (routeVisits[visitor.route] || 0) + visitor.visits;
    });

    const sortedRoutes = Object.entries(routeVisits)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // Top 10 routes

    this.visitorsByRouteChart.labels = sortedRoutes.map(([route]) => route);
    this.visitorsByRouteChart.datasets[0].data = sortedRoutes.map(([,visits]) => visits);
  }

  private updateVisitorsByCountryChart() {
    const countryVisits: { [key: string]: number } = {};
    
    this.visitorData.forEach(visitor => {
      const flagAndCountry = `${visitor.flag} ${visitor.country}`;
      countryVisits[flagAndCountry] = (countryVisits[flagAndCountry] || 0) + visitor.visits;
    });

    this.visitorsByCountryChart.labels = Object.keys(countryVisits);
    this.visitorsByCountryChart.datasets[0].data = Object.values(countryVisits);
  }

  async refreshData() {
    await this.loadAnalyticsData();
  }

  getIpAnalysis() {
    const ipData: { [ip: string]: { totalVisits: number, domains: { [domain: string]: { visits: number, routes: { [route: string]: number } } } } } = {};
    
    this.visitorData.forEach(visitor => {
      if (!ipData[visitor.ip]) {
        ipData[visitor.ip] = { totalVisits: 0, domains: {} };
      }
      
      ipData[visitor.ip].totalVisits += visitor.visits;
      
      if (!ipData[visitor.ip].domains[visitor.domain]) {
        ipData[visitor.ip].domains[visitor.domain] = { visits: 0, routes: {} };
      }
      
      ipData[visitor.ip].domains[visitor.domain].visits += visitor.visits;
      ipData[visitor.ip].domains[visitor.domain].routes[visitor.route] = visitor.visits;
    });
    
    return Object.entries(ipData)
      .sort(([,a], [,b]) => b.totalVisits - a.totalVisits)
      .slice(0, 10) // Top 10 IPs
      .map(([ip, data]) => ({
        ip,
        totalVisits: data.totalVisits,
        domains: Object.entries(data.domains).map(([domainName, domainData]) => ({
          name: domainName,
          visits: domainData.visits,
          routes: Object.entries(domainData.routes).map(([path, visits]) => ({
            path,
            visits
          })).sort((a, b) => b.visits - a.visits)
        })).sort((a, b) => b.visits - a.visits)
      }));
  }
}