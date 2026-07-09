import type { Veredicto } from './types.js';

export const MAX_EVALUATIONS = 4;

export const NOTE_MIN = 1;
export const NOTE_MAX = 5;

export const NOTE_LABELS = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente'] as const;

export const NOTE_LEGEND = '1 Ruim · 2 Regular · 3 Bom · 4 Muito bom · 5 Excelente';

export const NOME_MAX_LENGTH = 120;
export const LINKEDIN_MAX_LENGTH = 300;
export const OBS_MAX_LENGTH = 2000;

export const SCORE_MAX_PER_EVALUATION = 45;

export const CRITERIA = [
  {
    key: 'comunicacao',
    label: 'Comunicação',
    subtitle: 'Verbal, escrita, vícios de linguagem',
    section: 'soft',
    hasNA: false,
  },
  {
    key: 'organizacao',
    label: 'Organização',
    subtitle: 'Tempo, assiduidade, interesse',
    section: 'soft',
    hasNA: false,
  },
  {
    key: 'proatividade',
    label: 'Proatividade',
    subtitle: 'Auto gestão, motivação',
    section: 'soft',
    hasNA: false,
  },
  {
    key: 'cultura',
    label: 'Cultura',
    subtitle: 'Perfil Agilize',
    section: 'soft',
    hasNA: false,
  },
  {
    key: 'elaboracaoPlano',
    label: 'Elaboração de Plano (IA)',
    subtitle: 'Ele sabe criar um plano versus só pede coisas para a IA',
    section: 'hard',
    hasNA: true,
  },
  {
    key: 'promptEngineering',
    label: 'Prompt Engineering (IA)',
    subtitle: 'Ele sabe como escrever um bom prompt (preciso, específico, contextual)',
    section: 'hard',
    hasNA: true,
  },
  {
    key: 'conhecimentoModelos',
    label: 'Conhecimento de Modelos',
    subtitle: 'Por que usaria um Opus versus um Sonnet?',
    section: 'hard',
    hasNA: true,
  },
  {
    key: 'web',
    label: 'Web',
    subtitle: 'Como funciona uma request HTTP?',
    section: 'hard',
    hasNA: true,
  },
  {
    key: 'conhecimentoAplicacao',
    label: 'Conhecimentos da Aplicação',
    subtitle: 'Você sabe me explicar tecnicamente o que você construiu?',
    section: 'hard',
    hasNA: true,
  },
] as const;

export type EvaluationCriterionKey = (typeof CRITERIA)[number]['key'];
export type CriterionSection = 'soft' | 'hard';

export const VEREDICTO_LABELS: Record<Veredicto, string> = {
  ajuda: 'Vai ajudar a Agilize',
  nao_ajuda: 'Não vai ajudar a Agilize',
};

export const VEREDICTO_OPTIONS = [
  { value: 'ajuda', label: 'Vai ajudar a Agilize' },
  { value: 'nao_ajuda', label: 'Não vai ajudar a Agilize' },
] as const;

export const VEREDICTO_BADGE: Record<Veredicto, string> = {
  ajuda: 'Vai ajudar',
  nao_ajuda: 'Não vai ajudar',
};
