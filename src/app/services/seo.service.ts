import { Injectable, Inject, PLATFORM_ID, Renderer2, RendererFactory2 } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private renderer: Renderer2;

  constructor(
    private title: Title,
    private meta: Meta,
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  setTitle(value: string) {
    this.title.setTitle(value);
    this.setMetaTag('og:title', value, true);
    this.setMetaTag('twitter:title', value);
  }

  setDescription(desc: string) {
    this.setMetaTag('description', desc, false, 'name');
    this.setMetaTag('og:description', desc, true);
    this.setMetaTag('twitter:description', desc);
  }

  setCanonical(url: string) {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.renderer.createElement('link');
      this.renderer.setAttribute(link, 'rel', 'canonical');
      this.renderer.appendChild(this.document.head, link);
    }
    this.renderer.setAttribute(link, 'href', url);
  }

  setJsonLd(schema: object) {
    // Remove existing JSON-LD if present
    const prev = this.document.getElementById('json-ld-primary');
    if (prev) prev.remove();
    const script = this.renderer.createElement('script');
    this.renderer.setAttribute(script, 'type', 'application/ld+json');
    this.renderer.setAttribute(script, 'id', 'json-ld-primary');
    script.text = JSON.stringify(schema);
    this.renderer.appendChild(this.document.head, script);
  }

  private setMetaTag(name: string, content: string, isOg = false, attr: 'name' | 'property' = isOg ? 'property' : 'name') {
    const selector = `${attr}='${name}'`;
    const existing = this.meta.getTag(selector);
    if (existing) {
      this.meta.updateTag({ [attr]: name, content });
    } else {
      this.meta.addTag({ [attr]: name, content });
    }
  }
}
