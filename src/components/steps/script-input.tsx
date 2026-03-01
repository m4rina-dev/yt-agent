"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, FileText } from "lucide-react";
import type { Scene } from "@/types";

interface ScriptInputProps {
  script: string;
  onScriptChange: (script: string) => void;
  onScenesParsed: (scenes: Scene[]) => void;
  onNext: () => void;
}

const EXAMPLE_SCRIPT = `¿Sabías que el 90% de las startups fracasan?

Pero no es por falta de ideas brillantes.

El verdadero problema es que construyen algo que nadie quiere.

La solución es simple: habla con tus usuarios antes de escribir una sola línea de código.

Valida tu idea con entrevistas, encuestas y MVPs.

Los founders exitosos no adivinan, preguntan.

¿Ya validaste tu idea? Cuéntame en los comentarios.`;

export function ScriptInput({
  script,
  onScriptChange,
  onScenesParsed,
  onNext,
}: ScriptInputProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!script.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/parse-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse script");
      }

      onScenesParsed(data.scenes);
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    onScriptChange(EXAMPLE_SCRIPT);
  };

  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
  const estimatedDuration = Math.ceil(wordCount / 2.5); // ~150 words per minute

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Script de tu Short</h2>
        <p className="text-muted-foreground">
          Pega el script de tu YouTube Short y lo dividiremos en escenas
          automáticamente
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Script
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={loadExample}>
              Cargar ejemplo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Pega aquí el script de tu YouTube Short..."
            value={script}
            onChange={(e) => onScriptChange(e.target.value)}
            className="min-h-[280px] text-base leading-relaxed resize-none bg-background"
          />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex gap-4">
              <span>{wordCount} palabras</span>
              <span>~{estimatedDuration}s estimados</span>
            </div>
            <span>{script.length} caracteres</span>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={handleParse}
            disabled={loading || !script.trim() || script.trim().length < 10}
            className="w-full h-11 text-base"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Parseando con Claude AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Parsear script en escenas
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
