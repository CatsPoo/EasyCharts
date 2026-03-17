import type { DirectoryShare, User } from "@easy-charts/easycharts-types";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
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
  useDirectorySharesQuery,
  useShareDirectoryMutation,
  useUnshareDirectoryContentMutation,
  useUnshareDirectoryMutation,
} from "../../hooks/chartsDirectoriesHooks";
import { useUserByIdQuery, useUsersSearchQuery } from "../../hooks/usersHooks";
import { type Perms, PrivilegeChips } from "./PrivilegeChips";

interface Props {
  open: boolean;
  onClose: () => void;
  directoryId: string;
}

// ── Shared layout ─────────────────────────────────────────────────────────────

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

// ── Already-shared user row ────────────────────────────────────────────────────

function ShareRow({
  share, directoryId, onRemove, removing,
}: {
  share: DirectoryShare;
  directoryId: string;
  onRemove: () => void;
  removing: boolean;
}) {
  const { data: user } = useUserByIdQuery(share.sharedWithUserId);
  const label = user?.displayName || user?.username || share.sharedWithUserId;
  const sub = user?.displayName ? user.username : undefined;

  const [perms, setPerms] = useState<Perms>({
    canEdit: share.canEdit,
    canDelete: share.canDelete,
    canShare: share.canShare,
  });
  const [includeContent, setIncludeContent] = useState(false);
  const [pendingUncheck, setPendingUncheck] = useState(false);

  useEffect(() => {
    setPerms({ canEdit: share.canEdit, canDelete: share.canDelete, canShare: share.canShare });
  }, [share.canEdit, share.canDelete, share.canShare]);

  const shareMutation = useShareDirectoryMutation();
  const unshareContentMutation = useUnshareDirectoryContentMutation();

  const busy = shareMutation.isPending || unshareContentMutation.isPending || removing;

  const handleTogglePrivilege = (k: keyof Perms, v: boolean) => {
    const updated = { ...perms, [k]: v };
    setPerms(updated);
    shareMutation.mutate({
      directoryId,
      sharedWithUserId: share.sharedWithUserId,
      permissions: updated,
      includeContent,
    });
  };

  const handleContentToggle = () => {
    if (!includeContent) {
      setIncludeContent(true);
      shareMutation.mutate(
        {
          directoryId,
          sharedWithUserId: share.sharedWithUserId,
          permissions: perms,
          includeContent: true,
        },
        { onError: () => setIncludeContent(false) },
      );
    } else {
      setPendingUncheck(true);
    }
  };

  const handleConfirmUncheck = () => {
    unshareContentMutation.mutate(
      { directoryId, sharedWithUserId: share.sharedWithUserId },
      {
        onSuccess: () => {
          setIncludeContent(false);
          setPendingUncheck(false);
        },
      },
    );
  };

  return (
    <Box sx={{ py: 0.5, px: 0.5 }}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <UserInfo label={label} sub={sub} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
          <PrivilegeChips {...perms} onChange={handleTogglePrivilege} disabled={busy} onRemove={onRemove} />
          <Chip
            size="small" label="Content"
            variant={includeContent ? "filled" : "outlined"}
            color={includeContent ? "warning" : "default"}
            onClick={handleContentToggle}
            disabled={busy}
            sx={{ fontSize: 11 }}
          />
        </Box>
      </Box>
      <Collapse in={pendingUncheck}>
        <Alert
          severity="warning"
          sx={{ mt: 0.5, fontSize: 12 }}
          action={
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Button
                size="small"
                onClick={() => setPendingUncheck(false)}
                disabled={unshareContentMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                size="small"
                color="warning"
                variant="contained"
                onClick={handleConfirmUncheck}
                disabled={unshareContentMutation.isPending}
              >
                {unshareContentMutation.isPending ? <CircularProgress size={14} /> : "Confirm"}
              </Button>
            </Box>
          }
        >
          This will remove <strong>{label}</strong>'s access to all charts in this directory.
        </Alert>
      </Collapse>
    </Box>
  );
}

// ── Search result row ──────────────────────────────────────────────────────────

function SearchResultRow({
  user, onAdd, adding,
}: {
  user: User;
  onAdd: (userId: string, perms: Perms, includeContent: boolean) => void;
  adding: boolean;
}) {
  const label = user.displayName || user.username;
  const sub = user.displayName ? user.username : undefined;
  const [perms, setPerms] = useState<Perms>({ canEdit: false, canDelete: false, canShare: false });
  const [includeContent, setIncludeContent] = useState(false);

  return (
    <Box sx={{ display: "flex", alignItems: "center", py: 0.75, px: 0.5 }}>
      <UserInfo label={label} sub={sub} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
        <PrivilegeChips
          {...perms}
          onChange={(k, v) => setPerms(p => ({ ...p, [k]: v }))}
          disabled={adding}
          onAdd={() => onAdd(user.id, perms, includeContent)}
        />
        <Chip
          size="small" label="Content"
          variant={includeContent ? "filled" : "outlined"}
          color={includeContent ? "warning" : "default"}
          onClick={() => setIncludeContent(v => !v)}
          disabled={adding}
          sx={{ fontSize: 11 }}
        />
      </Box>
    </Box>
  );
}

// ── Main dialog ───────────────────────────────────────────────────────────────

export function ShareDirectoryDialog({ open, onClose, directoryId }: Props) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!open) { setSearchInput(""); setDebouncedQ(""); }
  }, [open]);

  const { data: shares = [], isLoading: sharesLoading } = useDirectorySharesQuery(open ? directoryId : null);
  const { data: searchResults = [], isFetching: searching } = useUsersSearchQuery(debouncedQ);
  const shareMutation = useShareDirectoryMutation();
  const unshareMutation = useUnshareDirectoryMutation();

  const sharedIds = new Set(shares.map(s => s.sharedWithUserId));
  const filteredResults = searchResults.filter(u => !sharedIds.has(u.id));

  const handleAdd = (userId: string, perms: Perms, includeContent: boolean) => {
    shareMutation.mutate({ directoryId, sharedWithUserId: userId, permissions: perms, includeContent });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share directory</DialogTitle>
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
              Add user — select privileges, toggle Content to also share charts inside
            </Typography>
            {filteredResults.map(user => (
              <SearchResultRow
                key={user.id}
                user={user}
                onAdd={handleAdd}
                adding={shareMutation.isPending}
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
                directoryId={directoryId}
                onRemove={() => unshareMutation.mutate({ directoryId, sharedWithUserId: share.sharedWithUserId })}
                removing={unshareMutation.isPending}
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
