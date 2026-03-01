"use client";

import { useState, useCallback } from "react";
import type {
  ProjectState,
  Scene,
  StockVideo,
  AudioLayer,
  CaptionStyle,
  SRTEntry,
} from "@/types";

const defaultCaptionStyle: CaptionStyle = {
  preset: "bold",
  fontFamily: "Arial",
  fontSize: 48,
  fontColor: "#FFFFFF",
  outlineColor: "#000000",
  outlineWidth: 3,
  position: "bottom",
  bold: true,
};

const initialState: ProjectState = {
  title: "",
  script: "",
  scenes: [],
  stockVideos: {},
  selectedVideos: {},
  audioLayers: [],
  captionStyle: defaultCaptionStyle,
  captions: [],
  currentStep: 0,
};

export function useProjectStore() {
  const [state, setState] = useState<ProjectState>(initialState);

  const setScript = useCallback((script: string) => {
    setState((prev) => ({ ...prev, script }));
  }, []);

  const setScenes = useCallback((scenes: Scene[]) => {
    setState((prev) => ({ ...prev, scenes }));
  }, []);

  const updateScene = useCallback((sceneId: string, updates: Partial<Scene>) => {
    setState((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === sceneId ? { ...s, ...updates } : s
      ),
    }));
  }, []);

  const removeScene = useCallback((sceneId: string) => {
    setState((prev) => ({
      ...prev,
      scenes: prev.scenes
        .filter((s) => s.id !== sceneId)
        .map((s, i) => ({ ...s, index: i })),
    }));
  }, []);

  const setStockVideos = useCallback(
    (sceneId: string, videos: StockVideo[]) => {
      setState((prev) => ({
        ...prev,
        stockVideos: { ...prev.stockVideos, [sceneId]: videos },
      }));
    },
    []
  );

  const selectVideo = useCallback((sceneId: string, video: StockVideo) => {
    setState((prev) => ({
      ...prev,
      selectedVideos: { ...prev.selectedVideos, [sceneId]: video },
      scenes: prev.scenes.map((s) =>
        s.id === sceneId ? { ...s, selectedVideoId: video.id } : s
      ),
    }));
  }, []);

  const setAudioLayers = useCallback((audioLayers: AudioLayer[]) => {
    setState((prev) => ({ ...prev, audioLayers }));
  }, []);

  const setCaptionStyle = useCallback((captionStyle: CaptionStyle) => {
    setState((prev) => ({ ...prev, captionStyle }));
  }, []);

  const setCaptions = useCallback((captions: SRTEntry[]) => {
    setState((prev) => ({ ...prev, captions }));
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const setTitle = useCallback((title: string) => {
    setState((prev) => ({ ...prev, title }));
  }, []);

  const resetProject = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    setScript,
    setScenes,
    updateScene,
    removeScene,
    setStockVideos,
    selectVideo,
    setAudioLayers,
    setCaptionStyle,
    setCaptions,
    setCurrentStep,
    setTitle,
    resetProject,
  };
}
