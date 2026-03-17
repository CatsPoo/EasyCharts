import type { DirectoryShare, GroupDirectoryShare } from "@easy-charts/easycharts-types";
import GroupsIcon from "@mui/icons-material/Groups";
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
import {
  useDirectoryGroupSharesQuery,
  useGroupsQuery,
  useShareDirectoryWithGroupMutation,
  useUnshareDirectoryContentFromGroupMutation,
  useUnshareDirectoryFromGroupMutation,
} from "../../hooks/groupsHooks";
import { useUserByIdQuery, useUsersSearchQuery } from "../../hooks/usersHooks";
import { type Perms, PrivilegeChips } from "./PrivilegeChips";

interface Props {
  open: boolean;
  onClose: () => void;
  directoryId: string;
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function UserInfo({ label, sub }: { label: string; sub?: string }) {
  return (
    <>
      <Avatar sx={{ width: 30, height: 30, fontSize: 13, flexShrink: 0 }}>
        {label[0].toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0, mx: 1 }}>
        <Typography variant="body2" noWrap sx={{ fontSize: 13 }}>{label}</Typography>
        {sub && <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11 }}>{sub}</Typography>}
      </Box>
    </>
  );
}

function GroupInfo({ label, memberCount }: { label: string; memberCount?: number }) {
  return (
    <>
      <Avatar sx={{ width: 30, height: 30, fontSize: 13, flexShrink: 0, bgcolor: "secondary.main" }}>
        <GroupsIcon sx={{ fontSize: 16 }} />
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0, mx: 1 }}>
        <Typography variant="body2" noWrap sx={{ fontSize: 13 }}>{label}</Typography>
        {memberCount !== undefined && (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11 }}>
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </Typography>
        )}
      </Box>
    </>
  );
}

// ── User share row ─────────────────────────────────────────────────────────────

function UserShareRow({ share, directoryId, onRemove, removing }: {
  share: DirectoryShare; directoryId: string; onRemove: () => void; removing: boolean;
}) {
  const { data: user } = useUserByIdQuery(share.sharedWithUserId);
  const label = user?.displayName || user?.username || share.sharedWithUserId;
  const sub = user?.displayName ? user.username : undefined;
  const [perms, setPerms] = useState<Perms>({ canEdit: share.canEdit, canDelete: share.canDelete, canShare: share.canShare });
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
    shareMutation.mutate({ directoryId, sharedWithUserId: share.sharedWithUserId, permissions: updated, includeContent });
  };

  const handleContentToggle = () => {
    if (!includeContent) {
      setIncludeContent(true);
      shareMutation.mutate(
        { directoryId, sharedWithUserId: share.sharedWithUserId, permissions: perms, includeContent: true },
        { onError: () => setIncludeContent(false) },
      );
    } else {
      setPendingUncheck(true);
    }
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
              <Button size="small" onClick={() => setPendingUncheck(false)} disabled={unshareContentMutation.isPending}>Cancel</Button>
              <Button
                size="small" color="warning" variant="contained"
                onClick={() => {
                  unshareContentMutation.mutate(
                    { directoryId, sharedWithUserId: share.sharedWithUserId },
                    { onSuccess: () => { setIncludeContent(false); setPendingUncheck(false); } },
                  );
                }}
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

// ── User search result row ─────────────────────────────────────────────────────

function UserSearchRow({ user, onAdd, adding }: {
  user: { id: string; displayName: string; username: string };
  onAdd: (userId: string, perms: Perms, includeContent: boolean) => void;
  adding: boolean;
}) {
  const label = user.displayName || user.username;
  const sub = user.displayName ? user.username : undefined;
  const [perms, setPerms] = useState<Perms>({ canEdit: false, canDelete: false, canShare: false });
  const [includeContent, setIncludeContent] = useState(false);
  const handleChange = (k: keyof Perms, v: boolean) => {
    const updated = { ...perms, [k]: v };
    setPerms(updated);
    if (v) onAdd(user.id, updated, includeContent); // enabling any privilege auto-adds (implies Read)
  };
  return (
    <Box sx={{ display: "flex", alignItems: "center", py: 0.75, px: 0.5 }}>
      <UserInfo label={label} sub={sub} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
        <PrivilegeChips {...perms} onChange={handleChange} disabled={adding} onAdd={() => onAdd(user.id, perms, includeContent)} />
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

// ── Group search result row ────────────────────────────────────────────────────

function GroupSearchRow({ group, onAdd, adding }: {
  group: { id: string; name: string; memberCount: number };
  onAdd: (groupId: string, perms: Perms, includeContent: boolean) => void;
  adding: boolean;
}) {
  const [perms, setPerms] = useState<Perms>({ canEdit: false, canDelete: false, canShare: false });
  const [includeContent, setIncludeContent] = useState(false);
  const handleChange = (k: keyof Perms, v: boolean) => {
    const updated = { ...perms, [k]: v };
    setPerms(updated);
    if (v) onAdd(group.id, updated, includeContent); // enabling any privilege auto-adds (implies Read)
  };
  return (
    <Box sx={{ display: "flex", alignItems: "center", py: 0.75, px: 0.5 }}>
      <GroupInfo label={group.name} memberCount={group.memberCount} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
        <PrivilegeChips
          {...perms}
          onChange={handleChange}
          disabled={adding}
          onAdd={() => onAdd(group.id, perms, includeContent)}
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

// ── Group share row ────────────────────────────────────────────────────────────

function GroupShareRow({ share, directoryId, onRemove, removing }: {
  share: GroupDirectoryShare; directoryId: string; onRemove: () => void; removing: boolean;
}) {
  const { data: allGroups = [] } = useGroupsQuery();
  const group = allGroups.find(g => g.id === share.sharedWithGroupId);
  const label = group?.name ?? share.sharedWithGroupId;

  const [perms, setPerms] = useState<Perms>({ canEdit: share.canEdit, canDelete: share.canDelete, canShare: share.canShare });
  const [includeContent, setIncludeContent] = useState(false);
  const [pendingUncheck, setPendingUncheck] = useState(false);

  useEffect(() => {
    setPerms({ canEdit: share.canEdit, canDelete: share.canDelete, canShare: share.canShare });
  }, [share.canEdit, share.canDelete, share.canShare]);

  const shareMutation = useShareDirectoryWithGroupMutation();
  const unshareContentMutation = useUnshareDirectoryContentFromGroupMutation();
  const busy = shareMutation.isPending || unshareContentMutation.isPending || removing;

  const handleTogglePrivilege = (k: keyof Perms, v: boolean) => {
    const updated = { ...perms, [k]: v };
    setPerms(updated);
    shareMutation.mutate({ directoryId, sharedWithGroupId: share.sharedWithGroupId, permissions: updated, includeContent });
  };

  const handleContentToggle = () => {
    if (!includeContent) {
      setIncludeContent(true);
      shareMutation.mutate(
        { directoryId, sharedWithGroupId: share.sharedWithGroupId, permissions: perms, includeContent: true },
        { onError: () => setIncludeContent(false) },
      );
    } else {
      setPendingUncheck(true);
    }
  };

  return (
    <Box sx={{ py: 0.5, px: 0.5 }}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <GroupInfo label={label} memberCount={group?.memberCount} />
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
              <Button size="small" onClick={() => setPendingUncheck(false)} disabled={unshareContentMutation.isPending}>Cancel</Button>
              <Button
                size="small" color="warning" variant="contained"
                onClick={() => {
                  unshareContentMutation.mutate(
                    { directoryId, groupId: share.sharedWithGroupId },
                    { onSuccess: () => { setIncludeContent(false); setPendingUncheck(false); } },
                  );
                }}
                disabled={unshareContentMutation.isPending}
              >
                {unshareContentMutation.isPending ? <CircularProgress size={14} /> : "Confirm"}
              </Button>
            </Box>
          }
        >
          This will remove group <strong>{label}</strong>'s access to all charts in this directory.
        </Alert>
      </Collapse>
    </Box>
  );
}

// ── Main dialog ────────────────────────────────────────────────────────────────

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
  const { data: groupShares = [], isLoading: groupSharesLoading } = useDirectoryGroupSharesQuery(open ? directoryId : null);
  const { data: searchResults = [], isFetching: searching } = useUsersSearchQuery(debouncedQ);
  const { data: allGroups = [] } = useGroupsQuery();

  const shareMutation = useShareDirectoryMutation();
  const unshareMutation = useUnshareDirectoryMutation();
  const shareGroupMutation = useShareDirectoryWithGroupMutation();
  const unshareGroupMutation = useUnshareDirectoryFromGroupMutation();

  const sharedUserIds = new Set(shares.map(s => s.sharedWithUserId));
  const sharedGroupIds = new Set(groupShares.map(s => s.sharedWithGroupId));

  const filteredUsers = searchResults.filter(u => !sharedUserIds.has(u.id));
  const availableGroups = allGroups.filter(g => !sharedGroupIds.has(g.id));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share directory</DialogTitle>
      <DialogContent sx={{ px: 2, pt: 1, pb: 0 }}>

        {/* User search */}
        <TextField
          fullWidth size="small"
          placeholder="Search users…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {searching ? <CircularProgress size={16} /> : <SearchIcon fontSize="small" />}
              </InputAdornment>
            ),
          }}
          sx={{ mt: 0.5, mb: 1 }}
        />

        {/* User search results */}
        {filteredUsers.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
              Add user — select privileges, toggle Content to also share charts inside
            </Typography>
            {filteredUsers.map(user => (
              <UserSearchRow
                key={user.id} user={user} adding={shareMutation.isPending}
                onAdd={(userId, perms, includeContent) =>
                  shareMutation.mutate({ directoryId, sharedWithUserId: userId, permissions: perms, includeContent })
                }
              />
            ))}
          </>
        )}

        {/* Shared with users */}
        {sharesLoading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 2 }}><CircularProgress size={24} /></Box>
        ) : shares.length > 0 ? (
          <>
            {filteredUsers.length > 0 && <Divider sx={{ my: 1 }} />}
            <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>Shared with users</Typography>
            {shares.map(share => (
              <UserShareRow
                key={share.sharedWithUserId} share={share} directoryId={directoryId}
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

        {/* ── Groups section ── */}
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5, display: "block", mb: 0.5 }}>
          Share with groups
        </Typography>

        {/* Available groups to add */}
        {availableGroups.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5, fontSize: 11 }}>
              Add group — select privileges, toggle Content to also share charts inside
            </Typography>
            {availableGroups.map(group => (
              <GroupSearchRow
                key={group.id}
                group={group}
                onAdd={(groupId, perms, includeContent) =>
                  shareGroupMutation.mutate({ directoryId, sharedWithGroupId: groupId, permissions: perms, includeContent })
                }
                adding={shareGroupMutation.isPending}
              />
            ))}
          </>
        )}

        {/* Shared with groups */}
        {groupSharesLoading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 1 }}><CircularProgress size={20} /></Box>
        ) : groupShares.length > 0 ? (
          <>
            {availableGroups.length > 0 && <Divider sx={{ my: 1 }} />}
            <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>Shared with groups</Typography>
            {groupShares.map(share => (
              <GroupShareRow
                key={share.sharedWithGroupId} share={share} directoryId={directoryId}
                onRemove={() => unshareGroupMutation.mutate({ directoryId, groupId: share.sharedWithGroupId })}
                removing={unshareGroupMutation.isPending}
              />
            ))}
          </>
        ) : (
          availableGroups.length === 0 && allGroups.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, py: 0.5 }}>
              No groups exist. Create groups in Users &amp; Groups settings.
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
