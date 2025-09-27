import { LockState } from "@easy-charts/easycharts-types";
import { Chip, CircularProgress, Fade, Tooltip } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";


type LockStatusChipProps = {
  lock?: { state: LockState; lockedByName?: string };
  isLoading?: boolean; // initial fetch if you want
  locking?: boolean; // acquire pending
  unlocking?: boolean; // release pending
};

 export function LockStatusChip({ lock, isLoading, locking, unlocking }: LockStatusChipProps) {
  // show spinner while any lock action is in-flight
  if (isLoading || locking || unlocking) {
    return (
      <Chip
        variant="outlined"
        color={locking ? "info" : unlocking ? "default" : "default"}
        icon={
          <Fade in>
            <CircularProgress size={14} thickness={5} />
          </Fade>
        }
        label={locking ? "Acquiring…" : unlocking ? "Releasing…" : "Loading…"}
        sx={{ ".MuiChip-icon": { mr: 0.5 } }}
      />
    );
  }

  if (!lock || lock.state === LockState.UNLOCKED) {
    return <Chip size="small" label="Unlocked" variant="outlined" />;
  }

  if (lock.state === LockState.MINE) {
    return (
      <Tooltip title="You hold the edit lock">
        <Chip
          size="small"
          icon={<LockOpenIcon />}
          label="Locked by you"
          color="success"
          variant="filled"
          sx={{ fontWeight: 600 }}
        />
      </Tooltip>
    );
  }
  return (
    <Tooltip title={`Locked by ${lock.lockedByName ?? "another user"}`}>
      <Chip
        size="small"
        icon={<LockIcon />}
        label={`Locked by ${lock.lockedByName ?? "someone"}`}
        color="warning"
        variant="filled"
        sx={{ fontWeight: 600 }}
      />
    </Tooltip>
  );
}