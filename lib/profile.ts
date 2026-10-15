export type ProfileValues = {
  name: string;
  whatWeDo: string;
  products: string;
  audience: string;
  tone: string[];
  voiceNotes: string;
  dos: string;
  donts: string;
};

export const emptyProfile: ProfileValues = {
  name: "",
  whatWeDo: "",
  products: "",
  audience: "",
  tone: [],
  voiceNotes: "",
  dos: "",
  donts: "",
};

export const TONE_OPTIONS = [
  "Friendly",
  "Professional",
  "Playful",
  "Bold",
  "Warm",
  "Luxury",
  "Straightforward",
  "Inspiring",
];
