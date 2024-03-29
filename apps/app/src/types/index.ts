import type React from "react";

export type AppProps = {
  children: React.ReactNode;
};

export type Section = {
  id: string;
  name: string | null;
  links: Link[];
};

export type ProfileSection = Omit<Section, "links"> & {
  links: Omit<Link, "hidden">[];
};

export type Link = {
  id: string;
  thumbnail?: string | null;
  text: string;
  url: string;
  hidden: boolean;
};

export type ProfileLink = Omit<Link, "hidden">;

export type ProfileLinks = ProfileSection["links"];

export type SocialLink = {
  id: string;
  url: string;
  icon: string;
};

export type Testimonial = {
  id: string;
  name: string;
  email: string;
  message: string;
  rating: number;
  shouldShow: boolean;
  avatar: string | null;
  createdAt: Date;
};
