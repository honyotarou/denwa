/** SIP 実装を UI から分離（T-SOFT: fake adapter でテスト） */

export type SipAdapterCallbacks = Readonly<{
  onRegistered: () => void;
  onRegisterFailed: (message: string) => void;
  onIncoming: (from: string) => void;
  onInCall: () => void;
  onEnded: () => void;
  onError: (message: string) => void;
}>;

export type SipAdapterConfig = Readonly<{
  extension: string;
  secret: string;
  host: string;
}>;

export type SipAdapter = Readonly<{
  register: (cfg: SipAdapterConfig, cb: SipAdapterCallbacks) => Promise<void>;
  unregister: () => Promise<void>;
  dial: (target: string) => Promise<void>;
  answer: () => Promise<void>;
  hangup: () => Promise<void>;
  sendDtmf: (digit: string) => Promise<void>;
  setMuted: (muted: boolean) => void;
}>;
