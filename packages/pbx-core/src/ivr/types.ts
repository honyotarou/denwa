export type IvrAction = 'goto_extension' | 'goto_ringgroup' | 'hangup';

export type IvrOptionDraft = Readonly<{
  digit: string;
  action: IvrAction;
  target: string | null;
  label: string | null;
}>;

export type IvrMenuDraft = Readonly<{
  number: string;
  name: string | null;
  welcomePrompt: string | null;
  menuPrompt: string | null;
  invalidPrompt: string | null;
  goodbyePrompt: string | null;
  maxRetries: number;
  waitSeconds: number;
  options: readonly IvrOptionDraft[];
}>;
