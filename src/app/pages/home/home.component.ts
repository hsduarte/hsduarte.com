import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';
import { SeoService } from '../../services/seo.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  currentLanguage = 'en';
  private themeSubscription: Subscription = new Subscription();

  // Translation dictionary
  translations: { [key: string]: { [key: string]: string } } = {
    en: {
      title: 'Full-Stack Developer',
      description: 'Full-stack developer specializing in Java/Kotlin backends (Spring Boot) and Angular frontends. I build reliable, scalable services and clean UIs, backed by a solid CS foundation from Academia de Código\'s intensive bootcamp.',
      experience: 'Experience',
      technicalSkills: 'Technical Skills',
      notableProjects: 'Notable Projects',
      portfolioSiteDescription: 'Personal portfolio built with Angular and TypeScript; deployed via GitHub Actions to Hetzner with Docker and Nginx; SEO-optimized and bilingual.',
      homelabDescription: 'Self-hosted homelab on Hetzner and Raspberry Pi with Grafana + Prometheus monitoring, custom analytics, Code-Server, Pi-hole, Immich; secure access via Tailscale.',
      radar17Description: 'Participatory debate platform with real-time voting, visualizer, and admin panel. Express + Socket.io with Docker Compose.',
      customAnalyticsDescription: 'Privacy-friendly website analytics pipeline with a custom collector integrated into Grafana dashboards and Prometheus metrics.',
      educationCertifications: 'Education & Certifications',
      programmingLanguages: 'Programming Languages',
      frameworksTechnologies: 'Frameworks & Technologies',
      webDevelopment: 'Web Development',
      devopsCloud: 'DevOps & Cloud',
      fullStackDevelopment: 'Full-Stack Development',
      objectOrientedProgramming: 'Object-Oriented Programming',
      softwareEngineerII: 'Software Engineer II',
      softwareDeveloper: 'Software Developer',
      july2025Present: 'July 2025 - Present',
      april2024July2025: 'April 2024 - July 2025',
      september2021April2024: 'September 2021 - April 2024',
      june2021September2021: 'June 2021 - September 2021',
      five9Description: 'Backend engineer on the core VCC platform. Added metrics and observability across services and improved reliability. Stack: Java, Spring Boot, MySQL; CI/CD with GitLab (GitLab Actions).',
      blipDescription: 'Backend developer on the core betting platform powering Paddy Power, Betfair, and Sky Bet. Improved Grafana dashboards and alerting, championed code quality, and led database evaluations and presentations that influenced technology choices.',
      criticalDescription: 'Built internal platforms at BMW/CTW, including a platform health monitor and a second internal tool. Worked across Java/Quarkus services and Angular/TypeScript where needed; deployed with Kubernetes, Terraform, and CI/CD.',
      celfocusDescription: 'Launched my professional career, contributing to enterprise systems and honing modern development practices.',
      danceGoDescription: 'Hackathon-built web app and REST API for dance challenges; delivered end-to-end under tight timelines.',
      javaBankDescription: 'Layered Java application demonstrating OOP, clean architecture, and testable design.',
      forkaDescription: 'Terminal-based multiplayer game demonstrating network programming and real-time mechanics.',
      bombermanoDescription: 'Java Bomberman clone showcasing game development and object-oriented design.',
      webDevelopmentTag: 'Web Development',
      oopTag: 'OOP',
      networkingTag: 'Networking',
      gameDevelopmentTag: 'Game Development',
      bootcampTitle: '14-Week Intensive Full-Stack Programming Bootcamp',
      computerScience101: 'Computer Science 101',
      november2020: 'November 2020',
      javaProgrammingFundamentals: 'Java & CS fundamentals',
      webDevelopmentOOP: 'Web development & OOP',
      databaseManagement: 'Databases & software engineering',
      stanfordDescription: 'Online certification covering fundamental computer science concepts and programming principles.'
    },
    pt: {
      title: 'Full-Stack Developer',
      description: 'Full-stack Developer especializado em backends Java/Kotlin (Spring Boot) e frontends Angular. Construo serviços fiáveis e escaláveis e UIs limpas, apoiado por uma base sólida da Academia de Código.',
      experience: 'Experiência',
      technicalSkills: 'Competências Técnicas',
      notableProjects: 'Projetos Notáveis',
      portfolioSiteDescription: 'Portefólio pessoal em Angular e TypeScript; deploy via GitHub Actions para Hetzner com Docker e Nginx; SEO otimizado e bilingue.',
      homelabDescription: 'Homelab self-hosted em Hetzner e Raspberry Pi com monitorização Grafana + Prometheus, analytics personalizado, Code-Server, Pi-hole, Immich; acesso seguro via Tailscale.',
      radar17Description: 'Plataforma de debate participativo com votação em tempo real, visualizador e painel de administração. Express + Socket.io com Docker Compose.',
      customAnalyticsDescription: 'Pipeline de analytics de website, focado em privacidade, com coletor custom e integração em dashboards Grafana e métricas Prometheus.',
      educationCertifications: 'Educação e Certificações',
      programmingLanguages: 'Linguagens de Programação',
      frameworksTechnologies: 'Frameworks e Tecnologias',
      webDevelopment: 'Desenvolvimento Web',
      devopsCloud: 'DevOps e Cloud',
      fullStackDevelopment: 'Desenvolvimento Full-Stack',
      objectOrientedProgramming: 'Programação Orientada a Objetos',
      softwareEngineerII: 'Engenheiro de Software II',
      softwareDeveloper: 'Desenvolvedor de Software',
      july2025Present: 'Julho 2025 - Presente',
      april2024July2025: 'Abril 2024 - Julho 2025',
      september2021April2024: 'Setembro 2021 - Abril 2024',
      june2021September2021: 'Junho 2021 - Setembro 2021',
      five9Description: 'Engenheiro backend na plataforma core VCC. Adicionei métricas e observabilidade nos serviços e melhorei a fiabilidade. Stack: Java, Spring Boot, MySQL; CI/CD com GitLab (GitLab Actions).',
      blipDescription: 'Backend no core de apostas que suporta Paddy Power, Betfair e Sky Bet. Melhorei dashboards e alertas no Grafana, promovi qualidade de código e liderei avaliações e apresentações de bases de dados que influenciaram escolhas tecnológicas.',
      criticalDescription: 'Construí plataformas internas na BMW/CTW, incluindo um monitor de saúde de plataformas e outro produto interno. Trabalhei em serviços Java/Quarkus e, quando necessário, em Angular/TypeScript; deploy com Kubernetes, Terraform e CI/CD.',
      celfocusDescription: 'Início de carreira profissional, contribuindo para sistemas empresariais e consolidando práticas modernas de desenvolvimento.',
      danceGoDescription: 'Aplicação web e REST API para desafios de dança, desenvolvida em hackathon com entrega end-to-end em prazos curtos.',
      javaBankDescription: 'Aplicação Java em camadas a demonstrar POO, arquitetura limpa e design testável.',
      forkaDescription: 'Jogo multiplayer em terminal a demonstrar programação de rede e mecânicas em tempo real.',
      bombermanoDescription: 'Clone de Bomberman em Java a demonstrar desenvolvimento de jogos e POO.',
      webDevelopmentTag: 'Desenvolvimento Web',
      oopTag: 'POO',
      networkingTag: 'Redes',
      gameDevelopmentTag: 'Desenvolvimento de Jogos',
      bootcampTitle: 'Bootcamp Intensivo de Programação Full-Stack de 14 Semanas',
      computerScience101: 'Ciência da Computação 101',
      november2020: 'Novembro 2020',
      javaProgrammingFundamentals: 'Java e fundamentos de CC',
      webDevelopmentOOP: 'Desenvolvimento web e POO',
      databaseManagement: 'Bases de dados e engenharia de software',
      stanfordDescription: 'Certificação online cobrindo conceitos fundamentais de ciência da computação e princípios de programação.'
    }
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private themeService: ThemeService,
    private seo: SeoService,
    private router: Router
  ) {}

  ngOnInit() {
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
    
    // Language from route (/pt) or saved preference
    const path = this.document?.location?.pathname || '/';
    if (path.startsWith('/pt')) {
      this.currentLanguage = 'pt';
    } else if (isPlatformBrowser(this.platformId)) {
      const savedLanguage = localStorage.getItem('language');
      this.currentLanguage = savedLanguage || 'en';
    }
    this.document.documentElement.lang = this.currentLanguage;

    // SEO for home (canonical depends on route)
    const currentUrl = this.document?.location?.href || '';
    const isLocalOrNgrok = currentUrl.includes('localhost') || currentUrl.includes('ngrok');
    
    let base: string;
    if (isLocalOrNgrok) {
      const urlObj = new URL(currentUrl);
      base = `${urlObj.protocol}//${urlObj.host}`;
    } else {
      base = 'https://hsduarte.com';
    }
    
    const url = `${base}${path || '/'}`;
    this.seo.setTitle('Hugo Duarte — Full‑Stack Developer in Porto');
    this.seo.setDescription('Full‑stack developer in Porto specializing in Java/Kotlin (Spring Boot), Angular, Kubernetes, Terraform, and CI/CD pipelines.');
    this.seo.setCanonical(url);
    
    // Add enhanced Open Graph tags
    const ogImageUrl = isLocalOrNgrok 
      ? `${base}/assets/og/og-image.png` 
      : 'https://hsduarte.com/assets/og/og-image.png';
    
    this.seo.setOpenGraphTags({
      url,
      type: 'profile',
      image: ogImageUrl,
      imageAlt: 'Hugo Duarte — Full‑Stack Developer in Porto',
      siteName: 'Hugo Duarte Portfolio'
    });
    // Enhanced structured data for better search results
    this.seo.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Person',
      'name': 'Hugo Duarte',
      'alternateName': 'HsDuarte',
      'jobTitle': 'Full-Stack Developer',
      'description': 'Experienced Full-Stack Developer specializing in Java, Kotlin, Angular, Spring Boot, cloud technologies, and DevOps',
      'url': 'https://hsduarte.com',
      'image': 'https://hsduarte.com/assets/profile.webp',
      'email': 'mailto:hello@hsduarte.com',
      'telephone': '+351-XXX-XXX-XXX',
      'knowsAbout': [
        'Java Programming',
        'Kotlin Development', 
        'Angular Framework',
        'Spring Boot',
        'DevOps',
        'Cloud Computing',
        'Kubernetes',
        'TypeScript',
        'JavaScript',
        'Full Stack Development',
        'Software Engineering',
        'Web Development'
      ],
      'sameAs': [
        'https://github.com/hsduarte',
        'https://www.linkedin.com/in/hsduarte/',
        'https://twitter.com/HsDuarte'
      ],
      'worksFor': {
        '@type': 'Organization',
        'name': 'Five9'
      },
      'address': { 
        '@type': 'PostalAddress', 
        'addressLocality': 'Porto', 
        'addressRegion': 'Porto District',
        'addressCountry': 'PT' 
      },
      'nationality': {
        '@type': 'Country',
        'name': 'Portugal'
      }
    });
  }

  ngOnDestroy() {
    this.themeSubscription.unsubscribe();
  }

  // Helper method to get translated text
  t(key: string): string {
    return this.translations[this.currentLanguage]?.[key] || this.translations['en'][key] || key;
  }

  // Getters for template access (Angular templates can't call methods directly)
  get title() { return this.t('title'); }
  get description() { return this.t('description'); }
  get experience() { return this.t('experience'); }
  get technicalSkills() { return this.t('technicalSkills'); }
  get notableProjects() { return this.t('notableProjects'); }
  get educationCertifications() { return this.t('educationCertifications'); }
  get programmingLanguages() { return this.t('programmingLanguages'); }
  get frameworksTechnologies() { return this.t('frameworksTechnologies'); }
  get webDevelopment() { return this.t('webDevelopment'); }
  get devopsCloud() { return this.t('devopsCloud'); }
  get fullStackDevelopment() { return this.t('fullStackDevelopment'); }
  get objectOrientedProgramming() { return this.t('objectOrientedProgramming'); }
  get softwareEngineerII() { return this.t('softwareEngineerII'); }
  get softwareDeveloper() { return this.t('softwareDeveloper'); }
  get july2025Present() { return this.t('july2025Present'); }
  get april2024July2025() { return this.t('april2024July2025'); }
  get september2021April2024() { return this.t('september2021April2024'); }
  get june2021September2021() { return this.t('june2021September2021'); }
  get five9Description() { return this.t('five9Description'); }
  get blipDescription() { return this.t('blipDescription'); }
  get criticalDescription() { return this.t('criticalDescription'); }
  get celfocusDescription() { return this.t('celfocusDescription'); }
  get danceGoDescription() { return this.t('danceGoDescription'); }
  get javaBankDescription() { return this.t('javaBankDescription'); }
  get forkaDescription() { return this.t('forkaDescription'); }
  get bombermanoDescription() { return this.t('bombermanoDescription'); }
  get portfolioSiteDescription() { return this.t('portfolioSiteDescription'); }
  get homelabDescription() { return this.t('homelabDescription'); }
  get radar17Description() { return this.t('radar17Description'); }
  get customAnalyticsDescription() { return this.t('customAnalyticsDescription'); }
  get webDevelopmentTag() { return this.t('webDevelopmentTag'); }
  get oopTag() { return this.t('oopTag'); }
  get networkingTag() { return this.t('networkingTag'); }
  get gameDevelopmentTag() { return this.t('gameDevelopmentTag'); }
  get bootcampTitle() { return this.t('bootcampTitle'); }
  get computerScience101() { return this.t('computerScience101'); }
  get november2020() { return this.t('november2020'); }
  get javaProgrammingFundamentals() { return this.t('javaProgrammingFundamentals'); }
  get webDevelopmentOOP() { return this.t('webDevelopmentOOP'); }
  get databaseManagement() { return this.t('databaseManagement'); }
  get stanfordDescription() { return this.t('stanfordDescription'); }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }

  toggleLanguage() {
    // Cycle through available languages
    const languages = Object.keys(this.translations);
    const currentIndex = languages.indexOf(this.currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    this.currentLanguage = languages[nextIndex];
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('language', this.currentLanguage);
    }

    // Update document lang and route
    this.document.documentElement.lang = this.currentLanguage;
    if (this.currentLanguage === 'pt') {
      this.router.navigateByUrl('/pt');
    } else {
      this.router.navigateByUrl('/');
    }
  }

  // Getter for the language button text
  get languageButtonText(): string {
    return this.currentLanguage === 'en' ? 'PT' : 'EN';
  }

  // Getter for accessibility label
  get languageAriaLabel(): string {
    return this.currentLanguage === 'en' ? 'Switch to Portuguese' : 'Switch to English';
  }


  scrollToExperience() {
    const experienceSection = document.getElementById('experience');
    if (experienceSection) {
      experienceSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}
