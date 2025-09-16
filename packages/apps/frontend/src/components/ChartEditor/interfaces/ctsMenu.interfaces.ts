type CtxKind = 'common'|'pane' | 'node' | 'edge' | 'handle';
interface CtxState  {
  open: boolean;
  x: number;
  y: number;
  kind: CtxKind;
  payload?: any;
};