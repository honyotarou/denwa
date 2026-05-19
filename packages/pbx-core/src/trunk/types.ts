export type TrunkDraft = Readonly<{
  name: string;
  host: string;
  port: number;
  username: string | null;
  secret: string | null;
  registration: boolean;
  fromUser: string | null;
  fromDomain: string | null;
  didInbound: string | null;
  outboundPrefix: string | null;
}>;
