export const MAX_EVALUATIONS = 4;

export const NOTE_MIN = 1;
export const NOTE_MAX = 5;

export const NOTE_LABELS = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente'] as const;

export const NOTE_LEGEND = '1 Ruim · 2 Regular · 3 Bom · 4 Muito bom · 5 Excelente';

export const NOME_MAX_LENGTH = 120;
export const LINKEDIN_MAX_LENGTH = 300;
export const OBS_MAX_LENGTH = 2000;

export const CRITERIA = [
  { key: 'comunicacao', label: 'Comunicação', hasNA: false },
  { key: 'tecnico', label: 'Conhecimento técnico', hasNA: true },
  { key: 'softskill', label: 'Soft skill', hasNA: false },
] as const;
