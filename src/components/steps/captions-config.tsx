"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Subtitles,
  Type,
} from "lucide-react";
import type { CaptionStyle } from "@/types";

interface CaptionsConfigProps {
  captionStyle: CaptionStyle;
  onCaptionStyleChange: (style: CaptionStyle) => void;
  onPrev: () => void;
  onNext: () => void;
}

const PRESETS: { value: CaptionStyle["preset"]; label: string; description: string }[] = [
  { value: "classic", label: "Clásico", description: "Subtítulos estándar en la parte inferior" },
  { value: "bold", label: "Bold", description: "Estilo CapCut con texto grande y bold" },
  { value: "karaoke", label: "Karaoke", description: "Las palabras se iluminan al ritmo del audio" },
];

export function CaptionsConfig({
  captionStyle,
  onCaptionStyleChange,
  onPrev,
  onNext,
}: CaptionsConfigProps) {
  const updateStyle = (updates: Partial<CaptionStyle>) => {
    onCaptionStyleChange({ ...captionStyle, ...updates });
  };

  const applyPreset = (preset: CaptionStyle["preset"]) => {
    switch (preset) {
      case "classic":
        onCaptionStyleChange({
          preset: "classic",
          fontFamily: "Arial",
          fontSize: 32,
          fontColor: "#FFFFFF",
          outlineColor: "#000000",
          outlineWidth: 2,
          position: "bottom",
          bold: false,
        });
        break;
      case "bold":
        onCaptionStyleChange({
          preset: "bold",
          fontFamily: "Arial",
          fontSize: 52,
          fontColor: "#FFFFFF",
          outlineColor: "#000000",
          outlineWidth: 4,
          position: "center",
          bold: true,
        });
        break;
      case "karaoke":
        onCaptionStyleChange({
          preset: "karaoke",
          fontFamily: "Arial",
          fontSize: 44,
          fontColor: "#FFD700",
          outlineColor: "#000000",
          outlineWidth: 3,
          position: "center",
          bold: true,
        });
        break;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Captions</h2>
        <p className="text-muted-foreground">
          Configura el estilo de los subtítulos automáticos
        </p>
      </div>

      {/* Preset selection */}
      <div className="grid grid-cols-3 gap-3">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => applyPreset(preset.value)}
            className={`p-4 rounded-lg border text-left transition-all ${
              captionStyle.preset === preset.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Type className="w-4 h-4" />
              <span className="font-medium text-sm">{preset.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{preset.description}</p>
          </button>
        ))}
      </div>

      {/* Style customization */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Subtitles className="w-4 h-4" />
            Personalizar estilo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Fuente</label>
              <select
                value={captionStyle.fontFamily}
                onChange={(e) => updateStyle({ fontFamily: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="Arial">Arial</option>
                <option value="Impact">Impact</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Verdana">Verdana</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Tamaño</label>
              <Input
                type="number"
                value={captionStyle.fontSize}
                onChange={(e) =>
                  updateStyle({ fontSize: parseInt(e.target.value) || 32 })
                }
                min={16}
                max={72}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Color texto</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={captionStyle.fontColor}
                  onChange={(e) => updateStyle({ fontColor: e.target.value })}
                  className="h-9 w-12 rounded border border-input cursor-pointer"
                />
                <Input
                  value={captionStyle.fontColor}
                  onChange={(e) => updateStyle({ fontColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Color contorno
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={captionStyle.outlineColor}
                  onChange={(e) =>
                    updateStyle({ outlineColor: e.target.value })
                  }
                  className="h-9 w-12 rounded border border-input cursor-pointer"
                />
                <Input
                  value={captionStyle.outlineColor}
                  onChange={(e) =>
                    updateStyle({ outlineColor: e.target.value })
                  }
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Posición</label>
              <select
                value={captionStyle.position}
                onChange={(e) =>
                  updateStyle({
                    position: e.target.value as CaptionStyle["position"],
                  })
                }
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="bottom">Abajo</option>
                <option value="center">Centro</option>
                <option value="top">Arriba</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Grosor contorno
              </label>
              <Input
                type="number"
                value={captionStyle.outlineWidth}
                onChange={(e) =>
                  updateStyle({
                    outlineWidth: parseInt(e.target.value) || 2,
                  })
                }
                min={0}
                max={8}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-black rounded-lg p-6 flex items-center justify-center min-h-[120px]">
            <span
              style={{
                fontFamily: captionStyle.fontFamily,
                fontSize: `${Math.min(captionStyle.fontSize, 36)}px`,
                color: captionStyle.fontColor,
                fontWeight: captionStyle.bold ? "bold" : "normal",
                textShadow: `
                  -${captionStyle.outlineWidth}px -${captionStyle.outlineWidth}px 0 ${captionStyle.outlineColor},
                  ${captionStyle.outlineWidth}px -${captionStyle.outlineWidth}px 0 ${captionStyle.outlineColor},
                  -${captionStyle.outlineWidth}px ${captionStyle.outlineWidth}px 0 ${captionStyle.outlineColor},
                  ${captionStyle.outlineWidth}px ${captionStyle.outlineWidth}px 0 ${captionStyle.outlineColor}
                `,
              }}
            >
              Preview de subtítulos
            </span>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground">
        Los subtítulos se generarán automáticamente del audio con Whisper en el
        paso de export.
      </p>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Audio
        </Button>
        <Button onClick={onNext}>
          Export
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
