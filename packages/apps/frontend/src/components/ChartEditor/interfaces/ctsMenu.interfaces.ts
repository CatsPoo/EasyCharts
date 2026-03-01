type CtxKind = 'common'|'pane' | 'node' | 'edge' | 'handle' | 'note' | 'bond' | 'cloud';
interface CtxState  {
  open: boolean;
  x: number;
  y: number;
  kind: CtxKind;
  payload?: any;
  canConnectPaired?: boolean;
};