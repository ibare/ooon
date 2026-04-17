export type Lang = 'en' | 'ko';

export interface FeatureItem {
  title: string;
  desc: string;
}

export interface Dictionary {
  nav: {
    home: string;
    examples: string;
    syntax: string;
    github: string;
  };
  hero: {
    headline: string;
    sub: string;
    cta_start: string;
    cta_github: string;
  };
  problem: {
    title: string;
    sub: string;
    current_title: string;
    current_items: string[];
    oon_title: string;
    oon_items: string[];
  };
  features: {
    title: string;
    sub: string;
    items: FeatureItem[];
  };
  quickStart: {
    title: string;
    sub: string;
    install: string;
    usage_label: string;
  };
  footerCta: {
    title: string;
    cta_github: string;
    cta_npm: string;
  };
  footer: {
    tagline: string;
  };
  examplesPage: {
    title: string;
    sub: string;
    source_label: string;
    render_label: string;
    play: string;
    stop: string;
    categories: Record<string, string>;
  };
  syntaxPage: {
    title: string;
    sub: string;
    sections: Record<string, string>;
  };
}
