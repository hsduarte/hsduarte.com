import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

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
      description: 'Passionate full-stack developer with expertise in Java, web development, and modern software engineering practices. Graduate of Academia de Código\'s intensive bootcamp with a strong foundation in computer science fundamentals.',
      experience: 'Experience',
      technicalSkills: 'Technical Skills',
      notableProjects: 'Notable Projects',
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
      five9Description: 'Contributing to enterprise-level software solutions, working with modern development practices and delivering high-quality applications for global clients.',
      blipDescription: 'Backend developer focused on developing robust applications using Kotlin and Java with Spring Boot framework, contributing to scalable software solutions.',
      criticalDescription: 'Full-stack developer working on BMW automotive projects. Involved in both front-end and back-end development using Java and Quarkus, Angular, and TypeScript. Experience with cloud technologies including Kubernetes, Terraform, and CI/CD with GitHub Actions.',
      celfocusDescription: 'Started professional career as a software developer, gaining experience in enterprise software development and modern programming practices.',
      danceGoDescription: 'Web and REST API application for dance challenges, developed during a hackathon showcasing rapid prototyping and full-stack development skills.',
      javaBankDescription: 'Multi-layered Java application demonstrating various programming concepts including object-oriented design and architectural patterns.',
      forkaDescription: 'Multiplayer terminal-based game showcasing network programming and real-time game mechanics implementation.',
      bombermanoDescription: 'Java-based Bomberman game replica demonstrating game development principles and object-oriented programming.',
      webDevelopmentTag: 'Web Development',
      oopTag: 'OOP',
      networkingTag: 'Networking',
      gameDevelopmentTag: 'Game Development',
      bootcampTitle: '14-Week Intensive Full-Stack Programming Bootcamp',
      computerScience101: 'Computer Science 101',
      november2020: 'November 2020',
      javaProgrammingFundamentals: 'Java Programming & Computer Science Fundamentals',
      webDevelopmentOOP: 'Web Development & Object-Oriented Programming',
      databaseManagement: 'Database Management & Software Engineering',
      stanfordDescription: 'Online certification covering fundamental computer science concepts and programming principles.'
    },
    pt: {
      title: 'Desenvolvedor Full-Stack',
      description: 'Desenvolvedor full-stack apaixonado com experiência em Java, desenvolvimento web e práticas modernas de engenharia de software. Graduado do bootcamp intensivo da Academia de Código com uma base sólida em fundamentos de ciência da computação.',
      experience: 'Experiência',
      technicalSkills: 'Competências Técnicas',
      notableProjects: 'Projetos Notáveis',
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
      five9Description: 'Contribuindo para soluções de software de nível empresarial, trabalhando com práticas modernas de desenvolvimento e entregando aplicações de alta qualidade para clientes globais.',
      blipDescription: 'Desenvolvedor backend focado no desenvolvimento de aplicações robustas usando Kotlin e Java com framework Spring Boot, contribuindo para soluções de software escaláveis.',
      criticalDescription: 'Desenvolvedor full-stack trabalhando em projetos automóveis da BMW. Envolvido no desenvolvimento frontend e backend usando Java e Quarkus, Angular e TypeScript. Experiência com tecnologias cloud incluindo Kubernetes, Terraform e CI/CD com GitHub Actions.',
      celfocusDescription: 'Iniciei a carreira profissional como desenvolvedor de software, ganhando experiência em desenvolvimento de software empresarial e práticas modernas de programação.',
      danceGoDescription: 'Aplicação web e REST API para desafios de dança, desenvolvida durante um hackathon demonstrando prototipagem rápida e competências de desenvolvimento full-stack.',
      javaBankDescription: 'Aplicação Java multi-camadas demonstrando vários conceitos de programação incluindo design orientado a objetos e padrões arquiteturais.',
      forkaDescription: 'Jogo multiplayer baseado em terminal demonstrando programação de rede e implementação de mecânicas de jogo em tempo real.',
      bombermanoDescription: 'Réplica do jogo Bomberman baseada em Java demonstrando princípios de desenvolvimento de jogos e programação orientada a objetos.',
      webDevelopmentTag: 'Desenvolvimento Web',
      oopTag: 'POO',
      networkingTag: 'Redes',
      gameDevelopmentTag: 'Desenvolvimento de Jogos',
      bootcampTitle: 'Bootcamp Intensivo de Programação Full-Stack de 14 Semanas',
      computerScience101: 'Ciência da Computação 101',
      november2020: 'Novembro 2020',
      javaProgrammingFundamentals: 'Programação Java e Fundamentos de Ciência da Computação',
      webDevelopmentOOP: 'Desenvolvimento Web e Programação Orientada a Objetos',
      databaseManagement: 'Gestão de Bases de Dados e Engenharia de Software',
      stanfordDescription: 'Certificação online cobrindo conceitos fundamentais de ciência da computação e princípios de programação.'
    }
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
    
    if (isPlatformBrowser(this.platformId)) {
      // Load saved language preference or default to English
      const savedLanguage = localStorage.getItem('language');
      this.currentLanguage = savedLanguage || 'en';
    }
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