import type { ChartShare, User } from "@easy-charts/easycharts-types";
import SearchIcon from "@mui/icons-material/Search";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  useChartSharesQuery,
  useShareChartMutation,
  useUnshareChartMutation,
} from "../../hooks/chartsDirectoriesHooks";
import { useUserByIdQuery, useUsersSearchQuery } from "../../hooks/usersHooks";
import { type Perms, PrivilegeChips } from "./PrivilegeChips";

interface Props {
  open: boolean;
  onClose: () => void;
  chartId: string;
  /** The caller's own privileges — chips they don't hold are non-interactive */
  myPrivileges?: { canEdit: boolean; canDelete: boolean; canShare: boolean };
  /** Creator of the chart — excluded from search results */
  creatorId?: string;
}

// ── Shared layout for a user row ──────────────────────────────────────────────

function UserInfo({ label, sub }: { label: string; sub?: string }) {
  return (
    <>
      <Avatar sx={{ width: 30, height: 30, fontSize: 13, flexShrink: 0 }}>
        {label[0].toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0, mx: 1 }}>
        <Typography variant="body2" noWrap sx={{ fontSize: 13 }}>{label}</Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11 }}>
            {sub}
          </Typography>
        )}
      </Box>
    </>
  );
}

// ── Already-shared user row (editable privileges) ─────────────────────────────

function ShareRow({
  share, chartId, onRemove, removing, ceiling,
}: {
  share: ChartShare;
  chartId: string;
  onRemove: () => void;
  removing: boolean;
  ceiling?: Perms;
}) {
  const { data: user } = useUserByIdQuery(share.sharedWithUserId);
  const label = user?.displayName || user?.username || share.sharedWithUserId;
  const sub = user?.displayName ? user.username : undefined;

  const [perms, setPerms] = useState<Perms>({
    canEdit: share.canEdit,
    canDelete: share.canDelete,
    canShare: share.canShare,
  });

  // Keep local state in sync when the query refetches after an update
  useEffect(() => {
    setPerms({ canEdit: share.canEdit, canDelete: share.canDelete, canShare: share.canShare });
  }, [share.canEdit, share.canDelete, share.canShare]);

  const shareMutation = useShareChartMutation();

  const handleToggle = (k: keyof Perms, v: boolean) => {
    const updated = { ...perms, [k]: v };
    setPerms(updated);
    shareMutation.mutate({ chartId, sharedWithUserId: share.sharedWithUserId, permissions: updated });
  };

  const busy = shareMutation.isPending || removing;

  return (
    <Box sx={{ display: "flex", alignItems: "center", py: 0.75, px: 0.5 }}>
      <UserInfo label={label} sub={sub} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
        <PrivilegeChips {...perms} onChange={handleToggle} disabled={busy} ceiling={ceiling} onRemove={onRemove} />
      </Box>
    </Box>
  );
}

// ── Search result row (choose privileges before adding) ───────────────────────

function SearchResultRow({
  user, onAdd, adding, ceiling,
}: {
  user: User;
  onAdd: (userId: string, perms: Perms) => void;
  adding: boolean;
  ceiling?: Perms;
}) {
  const label = user.displayName || user.username;
  const sub = user.displayName ? user.username : undefined;
  const [perms, setPerms] = useState<Perms>({ canEdit: false, canDelete: false, canShare: false });

  return (
    <Box sx={{ display: "flex", alignItems: "center", py: 0.75, px: 0.5 }}>
      <UserInfo label={label} sub={sub} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
        <PrivilegeChips
          {...perms}
          onChange={(k, v) => setPerms(p => ({ ...p, [k]: v }))}
          disabled={adding}
          ceiling={ceiling}
          onAdd={() => onAdd(user.id, perms)}
        />
      </Box>
    </Box>
  );
}

// ── Main dialog ───────────────────────────────────────────────────────────────

export function ShareChartDialog({ open, onClose, chartId, myPrivileges, creatorId }: Props) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!open) { setSearchInput(""); setDebouncedQ(""); }
  }, [open]);

  const { data: shares = [], isLoading: sharesLoading } = useChartSharesQuery(open ? chartId : null);
  const { data: searchResults = [], isFetching: searching } = useUsersSearchQuery(debouncedQ);
  const shareMutation = useShareChartMutation();
  const unshareMutation = useUnshareChartMutation();

  const sharedIds = new Set(shares.map(s => s.sharedWithUserId));
  const filteredResults = searchResults.filter(u => !sharedIds.has(u.id) && u.id !== creatorId);

  const handleAdd = (userId: string, perms: Perms) => {
    shareMutation.mutate({ chartId, sharedWithUserId: userId, permissions: perms });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share chart</DialogTitle>
      <DialogContent sx={{ px: 2, pt: 1, pb: 0 }}>

        {/* Search bar */}
        <TextField
          fullWidth size="small"
          placeholder="Search users…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {searching
                  ? <CircularProgress size={16} />
                  : <SearchIcon fontSize="small" />}
              </InputAdornment>
            ),
          }}
          sx={{ mt: 0.5, mb: 1 }}
        />

        {/* Search results */}
        {filteredResults.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
              Add user — select privileges then click +
            </Typography>
            {filteredResults.map(user => (
              <SearchResultRow
                key={user.id}
                user={user}
                onAdd={handleAdd}
                adding={shareMutation.isPending}
                ceiling={myPrivileges}
              />
            ))}
          </>
        )}

        {/* Already shared with */}
        {sharesLoading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : shares.length > 0 ? (
          <>
            {filteredResults.length > 0 && <Divider sx={{ my: 1 }} />}
            <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
              Shared with
            </Typography>
            {shares.map(share => (
              <ShareRow
                key={share.sharedWithUserId}
                share={share}
                chartId={chartId}
                onRemove={() => unshareMutation.mutate({ chartId, sharedWithUserId: share.sharedWithUserId })}
                removing={unshareMutation.isPending}
                ceiling={myPrivileges}
              />
            ))}
          </>
        ) : (
          debouncedQ.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: "center" }}>
              Not shared with anyone yet. Search to add users.
            </Typography>
          )
        )}

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
