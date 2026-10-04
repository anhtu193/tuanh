export type Project = {
  id: string;
  title: string;
  slug: string;
  description: string;
  projectUrl?: string;
  githubUrl?: string;
  imageUrl: string;
  imagePublicId?: string;
  technologies: string[];
  visible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProjectInput = {
  title: string;
  description: string;
  projectUrl?: string;
  githubUrl?: string;
  imageUrl: string;
  imagePublicId?: string;
  technologies: string[];
  visible: boolean;
};

export type FindMeLink = {
  label: string;
  url: string;
};

export type StackItem = {
  icon: string;
  title: string;
  href?: string;
};

export type SiteProfile = {
  stack: StackItem[];
  links: FindMeLink[];
};

export type SiteProfileInput = {
  stack: StackItem[];
  links: FindMeLink[];
};
