import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

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
  
  private componentId = Math.random().toString(36).substr(2, 9);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    console.log('ApartmentComponent constructor called with ID:', this.componentId);
  }

  ngOnInit() {
    console.log('ApartmentComponent ngOnInit called for ID:', this.componentId);
    this.loadApartmentImages();
  }

  ngOnDestroy() {
    console.log('ApartmentComponent ngOnDestroy called for ID:', this.componentId);
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
    }
  }

  openGallery(image: ApartmentImage) {
    this.selectedImage = image;
    this.currentImageIndex = this.images.indexOf(image);
    this.showGallery = true;
    
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
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
}