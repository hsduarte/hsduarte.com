import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

interface ApartmentImage {
  src: string;
  alt: string;
  thumbnail: string;
}

@Component({
  selector: 'app-apartment',
  imports: [CommonModule],
  templateUrl: './apartment.component.html',
  styleUrl: './apartment.component.scss'
})
export class ApartmentComponent implements OnInit, OnDestroy {
  images: ApartmentImage[] = [];
  selectedImage: ApartmentImage | null = null;
  showGallery = false;
  currentImageIndex = 0;
  imageLoaded: boolean[] = [];
  fullImageLoaded: boolean[] = [];
  shouldLoadFullImage: boolean[] = [];
  lightboxImageLoading = true;
  isDarkMode = false;
  currentLanguage = 'en';
  
  private componentId = Math.random().toString(36).substr(2, 9);
  private intersectionObserver: IntersectionObserver | null = null;
  private themeSubscription: Subscription = new Subscription();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private themeService: ThemeService
  ) {
    console.log('ApartmentComponent constructor called with ID:', this.componentId);
  }

  ngOnInit() {
    console.log('ApartmentComponent ngOnInit called for ID:', this.componentId);
    
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
    
    if (isPlatformBrowser(this.platformId)) {
      // Load saved language preference or default to English
      const savedLanguage = localStorage.getItem('language');
      this.currentLanguage = savedLanguage || 'en';
    }
    
    this.loadApartmentImages();
    this.setupIntersectionObserver();
  }

  ngOnDestroy() {
    console.log('ApartmentComponent ngOnDestroy called for ID:', this.componentId);
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    this.themeSubscription.unsubscribe();
  }

  loadApartmentImages() {
    if (isPlatformBrowser(this.platformId)) {
      // This would typically be loaded from a service or API
      // For now, we'll assume images are in the assets/apartment folder
      const imageNames = [
        'living-room.jpg',
        'bedroom.jpg',
        'kitchen.jpg',
        'kitchen2.jpg',
        'bathroom.jpg',
        'terrace.jpg',
        'exterior.jpg',
        'hallway.jpg',
        'view.jpg'
      ];

      this.images = imageNames.map(name => ({
        src: `assets/apartment/${name}`,
        alt: `Apartment ${name.split('.')[0].replace('-', ' ')}`,
        thumbnail: `assets/apartment/thumbs/${name}`
      }));
      
      // Initialize loading states
      this.imageLoaded = new Array(this.images.length).fill(false);
      this.fullImageLoaded = new Array(this.images.length).fill(false);
      this.shouldLoadFullImage = new Array(this.images.length).fill(false);
      
      // Preload first few thumbnails
      this.preloadImages(0, Math.min(3, this.images.length));
    }
  }

  openGallery(image: ApartmentImage) {
    this.selectedImage = image;
    this.currentImageIndex = this.images.indexOf(image);
    this.showGallery = true;
    this.lightboxImageLoading = true;
    
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
    
    // Preload adjacent images
    this.preloadAdjacentImages();
  }

  closeGallery() {
    this.showGallery = false;
    this.selectedImage = null;
    
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'auto';
    }
  }

  nextImage() {
    if (this.currentImageIndex < this.images.length - 1) {
      this.currentImageIndex++;
      this.selectedImage = this.images[this.currentImageIndex];
    }
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.selectedImage = this.images[this.currentImageIndex];
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.showGallery) {
      switch (event.key) {
        case 'Escape':
          this.closeGallery();
          break;
        case 'ArrowLeft':
          this.previousImage();
          break;
        case 'ArrowRight':
          this.nextImage();
          break;
      }
    }
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }

  toggleLanguage() {
    // Cycle between languages
    this.currentLanguage = this.currentLanguage === 'en' ? 'pt' : 'en';
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('language', this.currentLanguage);
    }
  }

  getText(en: string, pt: string): string {
    return this.currentLanguage === 'pt' ? pt : en;
  }

  // Getter for the language button text
  get languageButtonText(): string {
    return this.currentLanguage === 'en' ? 'PT' : 'EN';
  }

  // Getter for accessibility label
  get languageAriaLabel(): string {
    return this.currentLanguage === 'en' ? 'Switch to Portuguese' : 'Switch to English';
  }

  private setupIntersectionObserver() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
          this.shouldLoadFullImage[index] = true;
        }
      });
    }, { rootMargin: '100px' });
  }

  onImageLoad(index: number) {
    this.imageLoaded[index] = true;
  }

  onFullImageLoad(index: number) {
    this.fullImageLoaded[index] = true;
  }

  onLightboxImageLoad() {
    this.lightboxImageLoading = false;
  }

  private preloadImages(start: number, end: number) {
    if (!isPlatformBrowser(this.platformId)) return;
    
    for (let i = start; i < end && i < this.images.length; i++) {
      const img = new Image();
      img.src = this.images[i].thumbnail;
    }
  }

  private preloadAdjacentImages() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const preloadIndices = [
      this.currentImageIndex - 1,
      this.currentImageIndex + 1
    ].filter(index => index >= 0 && index < this.images.length);
    
    preloadIndices.forEach(index => {
      const img = new Image();
      img.src = this.images[index].src;
    });
  }
}