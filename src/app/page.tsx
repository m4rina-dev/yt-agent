"use client";

import { Stepper } from "@/components/stepper";
import { ScriptInput } from "@/components/steps/script-input";
import { SceneEditor } from "@/components/steps/scene-editor";
import { AudioManager } from "@/components/steps/audio-manager";
import { CaptionsConfig } from "@/components/steps/captions-config";
import { ExportPanel } from "@/components/steps/export-panel";
import { useProjectStore } from "@/lib/store";
import { Film } from "lucide-react";

export default function Home() {
  const {
    state,
    setScript,
    setScenes,
    updateScene,
    removeScene,
    setAudioLayers,
    setCaptionStyle,
    setCurrentStep,
  } = useProjectStore();

  const totalDuration = state.scenes.reduce((sum, s) => sum + s.duration, 0);

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <ScriptInput
            script={state.script}
            onScriptChange={setScript}
            onScenesParsed={setScenes}
            onNext={() => setCurrentStep(1)}
          />
        );
      case 1:
        return (
          <SceneEditor
            scenes={state.scenes}
            onUpdateScene={updateScene}
            onRemoveScene={removeScene}
            onScenesChange={setScenes}
            onPrev={() => setCurrentStep(0)}
            onNext={() => setCurrentStep(2)}
          />
        );
      case 2:
        return (
          <AudioManager
            audioLayers={state.audioLayers}
            onAudioLayersChange={setAudioLayers}
            totalVideoDuration={totalDuration}
            onPrev={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        );
      case 3:
        return (
          <CaptionsConfig
            captionStyle={state.captionStyle}
            onCaptionStyleChange={setCaptionStyle}
            onPrev={() => setCurrentStep(2)}
            onNext={() => setCurrentStep(4)}
          />
        );
      case 4:
        return (
          <ExportPanel
            scenes={state.scenes}
            totalDuration={totalDuration}
            hasAudio={state.audioLayers.length > 0}
            onPrev={() => setCurrentStep(3)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">
              Stock<span className="text-primary">Shorts</span>
            </h1>
          </div>
          <div className="flex-1 max-w-2xl mx-8">
            <Stepper
              currentStep={state.currentStep}
              onStepClick={setCurrentStep}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {state.scenes.length > 0 && (
              <span>
                {state.scenes.length} escenas &middot; {totalDuration}s
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-8 px-4">
        {renderStep()}
      </main>

      {/* Footer */}
      <footer className="border-t py-3 text-center text-xs text-muted-foreground">
        StockShorts Generator &mdash; Vídeos de{" "}
        <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          Pexels
        </a>{" "}
        &{" "}
        <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          Pixabay
        </a>
      </footer>
    </div>
  );
}
