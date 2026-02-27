type CtxKind = 'common'|'pane' | 'node' | 'edge' | 'handle' | 'note';
interface CtxState  {
  open: boolean;
  x: number;
  y: number;
  kind: CtxKind;
  payload?: any;
  canConnectPaired?: boolean;
};