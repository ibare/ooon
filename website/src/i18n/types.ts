export type Lang = 'en' | 'ko';

export interface FeatureItem {
  title: string;
  desc: string;
}

export interface SectionCopy {
  title: string;
  body: string;
}

export interface Dictionary {
  nav: {
    home: string;
    getStarted: string;
    showcase: string;
    syntax: string;
    playground: string;
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
  getStartedPage: {
    title: string;
    sub: string;
    install_label: string;
    source_label: string;
    render_label: string;
    sections: {
      intro: SectionCopy;
      install: SectionCopy & { peer_label: string; peers: { name: string; range: string }[] };
      setup: SectionCopy & { font_note: string };
      fence: SectionCopy & { tokenizer_note: string };
      types: { title: string; body: string; categories: Record<string, string> };
      inline: SectionCopy;
      try: SectionCopy;
      next: {
        title: string;
        body: string;
        showcase: { title: string; desc: string };
        syntax: { title: string; desc: string };
        playground: { title: string; desc: string };
      };
    };
  };
  showcasePage: {
    title: string;
    sub: string;
    source_label: string;
    render_label: string;
    genres: Record<string, string>;
  };
  syntaxPage: {
    title: string;
    sub: string;
    sections: Record<string, string>;
  };
  playgroundPage: {
    title: string;
    sub: string;
  };
}
