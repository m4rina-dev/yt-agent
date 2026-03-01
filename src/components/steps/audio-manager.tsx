"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Music,
  Mic,
  Sparkles,
  Trash2,
  Volume2,
} from "lucide-react";
import type { AudioLayer } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface AudioManagerProps {
  audioLayers: AudioLayer[];
  onAudioLayersChange: (layers: AudioLayer[]) => void;
  totalVideoDuration: number;
  onPrev: () => void;
  onNext: () => void;
}

export function AudioManager({
  audioLayers,
  onAudioLayersChange,
  totalVideoDuration,
  onPrev,
  onNext,
}: AudioManagerProps) {
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: AudioLayer["type"]
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newLayer: AudioLayer = {
      id: uuidv4(),
      name: file.name,
      file,
      fileUrl: URL.createObjectURL(file),
      type,
      volume: type === "music" ? 0.3 : 1.0,
    };

    onAudioLayersChange([...audioLayers, newLayer]);
  };

  const removeLayer = (id: string) => {
    const layer = audioLayers.find((l) => l.id === id);
    if (layer?.fileUrl) URL.revokeObjectURL(layer.fileUrl);
    onAudioLayersChange(audioLayers.filter((l) => l.id !== id));
  };

  const updateVolume = (id: string, volume: number) => {
    onAudioLayersChange(
      audioLayers.map((l) => (l.id === id ? { ...l, volume } : l))
    );
  };

  const getTypeIcon = (type: AudioLayer["type"]) => {
    switch (type) {
      case "voiceover":
        return <Mic className="w-4 h-4" />;
      case "music":
        return <Music className="w-4 h-4" />;
      case "effect":
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: AudioLayer["type"]) => {
    switch (type) {
      case "voiceover":
        return "Voiceover";
      case "music":
        return "Música";
      case "effect":
        return "Efecto";
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Audio</h2>
        <p className="text-muted-foreground">
          Sube voiceover, música de fondo y efectos de sonido
        </p>
      </div>

      {/* Duration indicator */}
      <div className="bg-secondary/50 rounded-lg px-4 py-3 text-sm text-center">
        Duración total del vídeo:{" "}
        <span className="font-medium text-foreground">{totalVideoDuration}s</span>
      </div>

      {/* Upload buttons */}
      <div className="grid grid-cols-3 gap-3">
        {(["voiceover", "music", "effect"] as const).map((type) => (
          <label key={type}>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, type)}
            />
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">{getTypeLabel(type)}</span>
            </div>
          </label>
        ))}
      </div>

      {/* Audio layers */}
      {audioLayers.length > 0 ? (
        <div className="space-y-3">
          {audioLayers.map((layer) => (
            <Card key={layer.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(layer.type)}
                    <CardTitle className="text-sm">{layer.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeLayer(layer.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Slider
                    value={[layer.volume * 100]}
                    onValueChange={([v]) => updateVolume(layer.id, v / 100)}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-10 text-right font-mono">
                    {Math.round(layer.volume * 100)}%
                  </span>
                </div>
                {layer.fileUrl && (
                  <audio controls src={layer.fileUrl} className="w-full mt-3 h-8" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No hay capas de audio. Sube al menos un voiceover para tu Short.
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Escenas
        </Button>
        <Button onClick={onNext}>
          Captions
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
