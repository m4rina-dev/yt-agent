export interface Scene {
  id: string;
  index: number;
  text: string;
  keywords: string[];
  duration: number;
  selectedVideoId?: string;
}

export interface StockVideo {
  id: string;
  source: "pexels" | "pixabay";
  thumbnailUrl: string;
  previewUrl: string;
  downloadUrl: string;
  width: number;
  height: number;
  duration: number;
  tags?: string;
}

export interface AudioLayer {
  id: string;
  name: string;
  file: File | null;
  fileUrl?: string;
  type: "voiceover" | "music" | "effect";
  volume: number;
  duration?: number;
}

export interface CaptionStyle {
  preset: "classic" | "bold" | "karaoke";
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  outlineColor: string;
  outlineWidth: number;
  position: "bottom" | "center" | "top";
  bold: boolean;
}

export interface SRTEntry {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

export interface ProjectState {
  id?: string;
  title: string;
  script: string;
  scenes: Scene[];
  stockVideos: Record<string, StockVideo[]>;
  selectedVideos: Record<string, StockVideo>;
  audioLayers: AudioLayer[];
  captionStyle: CaptionStyle;
  captions: SRTEntry[];
  currentStep: number;
}

export type Step = {
  id: number;
  title: string;
  description: string;
};

export const STEPS: Step[] = [
  { id: 0, title: "Script", description: "Pega tu script" },
  { id: 1, title: "Escenas", description: "Edita y selecciona vídeos" },
  { id: 2, title: "Audio", description: "Sube y configura audio" },
  { id: 3, title: "Captions", description: "Subtítulos automáticos" },
  { id: 4, title: "Export", description: "Preview y descarga" },
];
