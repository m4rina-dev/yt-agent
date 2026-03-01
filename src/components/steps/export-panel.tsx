"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  Download,
  Film,
  FileText,
  Scissors,
  Video,
} from "lucide-react";
import type { Scene } from "@/types";

interface ExportPanelProps {
  scenes: Scene[];
  totalDuration: number;
  hasAudio: boolean;
  onPrev: () => void;
}

export function ExportPanel({
  scenes,
  totalDuration,
  hasAudio,
  onPrev,
}: ExportPanelProps) {
  const allScenesSelected = scenes.every((s) => s.selectedVideoId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Preview & Export</h2>
        <p className="text-muted-foreground">
          Renderiza y descarga tu YouTube Short
        </p>
      </div>

      {/* Status summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Resumen del proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Escenas:</span>
              <span className="font-medium">{scenes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duración:</span>
              <span className="font-medium">{totalDuration}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vídeos seleccionados:</span>
              <span className="font-medium">
                {scenes.filter((s) => s.selectedVideoId).length}/{scenes.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Audio:</span>
              <span className="font-medium">
                {hasAudio ? "Sí" : "No"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Render button */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Button
            className="w-full h-12 text-base"
            size="lg"
            disabled={!allScenesSelected}
          >
            <Film className="w-5 h-5 mr-2" />
            Renderizar vídeo (1080x1920)
          </Button>
          {!allScenesSelected && (
            <p className="text-xs text-center text-muted-foreground">
              Selecciona un vídeo para cada escena antes de renderizar
            </p>
          )}
        </CardContent>
      </Card>

      {/* Download options (shown after render) */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" disabled className="h-auto py-4 flex-col gap-2">
          <Video className="w-5 h-5" />
          <span className="text-xs">Vídeo completo</span>
        </Button>
        <Button variant="outline" disabled className="h-auto py-4 flex-col gap-2">
          <Video className="w-5 h-5" />
          <span className="text-xs">Sin captions</span>
        </Button>
        <Button variant="outline" disabled className="h-auto py-4 flex-col gap-2">
          <FileText className="w-5 h-5" />
          <span className="text-xs">Archivo SRT</span>
        </Button>
        <Button variant="outline" disabled className="h-auto py-4 flex-col gap-2">
          <Download className="w-5 h-5" />
          <span className="text-xs">Todos los archivos</span>
        </Button>
      </div>

      {/* Individual scene downloads */}
      {scenes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              Escenas individuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {scenes.map((scene) => (
                <Button
                  key={scene.id}
                  variant="outline"
                  size="sm"
                  disabled
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Escena {scene.index + 1} ({scene.duration}s)
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Captions
        </Button>
        <div />
      </div>
    </div>
  );
}
