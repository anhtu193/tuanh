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
};
