"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  GripVertical,
  Trash2,
  Plus,
  Clock,
  Tag,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  Check,
} from "lucide-react";
import type { Scene } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface SceneEditorProps {
  scenes: Scene[];
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => void;
  onRemoveScene: (sceneId: string) => void;
  onScenesChange: (scenes: Scene[]) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function SceneEditor({
  scenes,
  onUpdateScene,
  onRemoveScene,
  onScenesChange,
  onPrev,
  onNext,
}: SceneEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState("");

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  const addScene = () => {
    const newScene: Scene = {
      id: uuidv4(),
      index: scenes.length,
      text: "",
      keywords: [],
      duration: 5,
    };
    onScenesChange([...scenes, newScene]);
    setEditingId(newScene.id);
  };

  const addKeyword = (sceneId: string) => {
    if (!newKeyword.trim()) return;
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;
    onUpdateScene(sceneId, {
      keywords: [...scene.keywords, newKeyword.trim()],
    });
    setNewKeyword("");
  };

  const removeKeyword = (sceneId: string, keywordIndex: number) => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;
    onUpdateScene(sceneId, {
      keywords: scene.keywords.filter((_, i) => i !== keywordIndex),
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Editor de Escenas</h2>
        <p className="text-muted-foreground">
          Revisa y edita las escenas generadas. Ajusta texto, keywords y
          duración.
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">{scenes.length}</span>{" "}
            escenas
          </span>
          <span className="text-muted-foreground">
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            <span className="text-foreground font-medium">{totalDuration}s</span>{" "}
            total
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={addScene}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Añadir escena
        </Button>
      </div>

      {/* Scene cards */}
      <div className="space-y-3">
        {scenes.map((scene) => {
          const isEditing = editingId === scene.id;

          return (
            <Card
              key={scene.id}
              className={
                isEditing ? "ring-1 ring-primary" : "hover:border-muted-foreground/30 transition-colors"
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <CardTitle className="text-sm font-medium">
                      Escena {scene.index + 1}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {scene.duration}s
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        setEditingId(isEditing ? null : scene.id)
                      }
                    >
                      {isEditing ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Pencil className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    {scenes.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onRemoveScene(scene.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Scene text */}
                {isEditing ? (
                  <Textarea
                    value={scene.text}
                    onChange={(e) =>
                      onUpdateScene(scene.id, { text: e.target.value })
                    }
                    className="text-sm min-h-[80px] resize-none"
                    placeholder="Texto de la escena..."
                  />
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    &ldquo;{scene.text}&rdquo;
                  </p>
                )}

                {/* Keywords */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Tag className="w-3 h-3" />
                    Keywords de búsqueda
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {scene.keywords.map((keyword, ki) => (
                      <Badge
                        key={ki}
                        variant="outline"
                        className="text-xs gap-1"
                      >
                        {keyword}
                        {isEditing && (
                          <button
                            onClick={() => removeKeyword(scene.id, ki)}
                            className="ml-0.5 hover:text-destructive"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </Badge>
                    ))}
                    {isEditing && (
                      <div className="flex gap-1">
                        <Input
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addKeyword(scene.id);
                            }
                          }}
                          placeholder="Nueva keyword..."
                          className="h-6 w-32 text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => addKeyword(scene.id)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Duration slider */}
                {isEditing && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16">
                      Duración:
                    </span>
                    <input
                      type="range"
                      min={2}
                      max={15}
                      step={0.5}
                      value={scene.duration}
                      onChange={(e) =>
                        onUpdateScene(scene.id, {
                          duration: parseFloat(e.target.value),
                        })
                      }
                      className="flex-1 accent-purple-500"
                    />
                    <span className="text-sm font-mono w-10 text-right">
                      {scene.duration}s
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {scenes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay escenas. Vuelve al paso anterior para parsear tu script.</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Script
        </Button>
        <Button onClick={onNext} disabled={scenes.length === 0}>
          Audio
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
