import type { ChartShare, GroupChartShare, User } from "@easy-charts/easycharts-types";
import GroupsIcon from "@mui/icons-material/Groups";
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
import {
  useChartGroupSharesQuery,
  useGroupsQuery,
  useShareChartWithGroupMutation,
  useUnshareChartFromGroupMutation,
} from "../../hooks/groupsHooks";
import { useUserByIdQuery, useUsersSearchQuery } from "../../hooks/usersHooks";
import { type Perms, PrivilegeChips } from "./PrivilegeChips";

interface Props {
  open: boolean;
  onClose: () => void;
  chartId: string;
  myPrivileges?: { canEdit: boolean; canDelete: boolean; canShare: boolean };
  creatorId?: string;
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

function UserShareRow({ share, chartId, onRemove, removing, ceiling }: {
  share: ChartShare; chartId: string; onRemove: () => void; removing: boolean; ceiling?: Perms;
}) {
  const { data: user } = useUserByIdQuery(share.sharedWithUserId);
  const label = user?.displayName || user?.username || share.sharedWithUserId;
  const sub = user?.displayName ? user.username : undefined;
  const [perms, setPerms] = useState<Perms>({ canEdit: share.canEdit, canDelete: share.canDelete, canShare: share.canShare });
  useEffect(() => {
    setPerms({ canEdit: share.canEdit, canDelete: share.canDelete, canShare: share.canShare });
  }, [share.canEdit, share.canDelete, share.canShare]);
  const shareMutation = useShareChartMutation();
  const handleToggle = (k: keyof Perms, v: boolean) => {
    const updated = { ...perms, [k]: v };
    setPerms(updated);
    shareMutation.mutate({ chartId, sharedWithUserId: share.sharedWithUserId, permissions: updated });
  };
  return (
    <Box sx={{ display: "flex", alignItems: "center", py: 0.75, px: 0.5 }}>
      <UserInfo label={label} sub={sub} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
        <PrivilegeChips {...perms} onChange={handleToggle} disabled={shareMutation.isPending || removing} ceiling={ceiling} onRemove={onRemove} />
      </Box>
    </Box>
  );
}

// ── User search result row ─────────────────────────────────────────────────────

function UserSearchRow({ user, onAdd, adding, ceiling }: {
  user: User; onAdd: (userId: string, perms: Perms) => void; adding: boolean; ceiling?: Perms;
}) {
  const label = user.displayName || user.username;
  const sub = user.displayName ? user.username : undefined;
  const [perms, setPerms] = useState<Perms>({ canEdit: false, canDelete: false, canShare: false });
  const handleChange = (k: keyof Perms, v: boolean) => {
    const updated = { ...perms, [k]: v };
    setPerms(updated);
    if (v) onAdd(user.id, updated); // enabling any privilege auto-adds (implies Read)
  };
  return (
    <Box sx={{ display: "flex", alignItems: "center", py: 0.75, px: 0.5 }}>
      <UserInfo label={label} sub={sub} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
        <PrivilegeChips {...perms} onChange={handleChange} disabled={adding} ceiling={ceiling} onAdd={() => onAdd(user.id, perms)} />
      </Box>
    </Box>
  );
}

// ── Group search result row ────────────────────────────────────────────────────

function GroupSearchRow({ group, onAdd, adding, ceiling }: {
  group: { id: string; name: string; memberCount: number };
  onAdd: (groupId: string, perms: Perms) => void;
  adding: boolean;
  ceiling?: Perms;
}) {
  const [perms, setPerms] = useState<Perms>({ canEdit: false, canDelete: false, canShare: false });
  const handleChange = (k: keyof Perms, v: boolean) => {
    const updated = { ...perms, [k]: v };
    setPerms(updated);
    if (v) onAdd(group.id, updated); // enabling any privilege auto-adds (implies Read)
  };
  return (
    <Box sx={{ display: "flex", alignItems: "center", py: 0.75, px: 0.5 }}>
      <GroupInfo label={group.name} memberCount={group.memberCount} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
        <PrivilegeChips
          {...perms}
          onChange={handleChange}
          disabled={adding}
          ceiling={ceiling}
          onAdd={() => onAdd(group.id, perms)}
        />
      </Box>
    </Box>
  );
}

// ── Group share row ────────────────────────────────────────────────────────────

function GroupShareRow({ share, chartId, onRemove, removing, ceiling }: {
  share: GroupChartShare; chartId: string; onRemove: () => void; removing: boolean; ceiling?: Perms;
}) {
  const { data: groups = [] } = useGroupsQuery();
  const group = groups.find(g => g.id === share.sharedWithGroupId);
  const label = group?.name ?? share.sharedWithGroupId;
  const [perms, setPerms] = useState<Perms>({ canEdit: share.canEdit, canDelete: share.canDelete, canShare: share.canShare });
  useEffect(() => {
    setPerms({ canEdit: share.canEdit, canDelete: share.canDelete, canShare: share.canShare });
  }, [share.canEdit, share.canDelete, share.canShare]);
  const shareMutation = useShareChartWithGroupMutation();
  const handleToggle = (k: keyof Perms, v: boolean) => {
    const updated = { ...perms, [k]: v };
    setPerms(updated);
    shareMutation.mutate({ chartId, sharedWithGroupId: share.sharedWithGroupId, permissions: updated });
  };
  return (
    <Box sx={{ display: "flex", alignItems: "center", py: 0.75, px: 0.5 }}>
      <GroupInfo label={label} memberCount={group?.memberCount} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
        <PrivilegeChips {...perms} onChange={handleToggle} disabled={shareMutation.isPending || removing} ceiling={ceiling} onRemove={onRemove} />
      </Box>
    </Box>
  );
}

// ── Main dialog ────────────────────────────────────────────────────────────────

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
  const { data: groupShares = [], isLoading: groupSharesLoading } = useChartGroupSharesQuery(open ? chartId : null);
  const { data: searchResults = [], isFetching: searching } = useUsersSearchQuery(debouncedQ);
  const { data: allGroups = [] } = useGroupsQuery();

  const shareMutation = useShareChartMutation();
  const unshareMutation = useUnshareChartMutation();
  const shareGroupMutation = useShareChartWithGroupMutation();
  const unshareGroupMutation = useUnshareChartFromGroupMutation();

  const sharedUserIds = new Set(shares.map(s => s.sharedWithUserId));
  const sharedGroupIds = new Set(groupShares.map(s => s.sharedWithGroupId));

  const filteredUsers = searchResults.filter(u => !sharedUserIds.has(u.id) && u.id !== creatorId);
  const availableGroups = allGroups.filter(g => !sharedGroupIds.has(g.id));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share chart</DialogTitle>
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
              Add user — select privileges then click +
            </Typography>
            {filteredUsers.map(user => (
              <UserSearchRow
                key={user.id} user={user}
                onAdd={(userId, perms) => shareMutation.mutate({ chartId, sharedWithUserId: userId, permissions: perms })}
                adding={shareMutation.isPending}
                ceiling={myPrivileges}
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
                key={share.sharedWithUserId} share={share} chartId={chartId}
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

        {/* ── Groups section ── */}
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5, display: "block", mb: 0.5 }}>
          Share with groups
        </Typography>

        {/* Available groups to add */}
        {availableGroups.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5, fontSize: 11 }}>
              Add group — select privileges then click +
            </Typography>
            {availableGroups.map(group => (
              <GroupSearchRow
                key={group.id}
                group={group}
                onAdd={(groupId, perms) => shareGroupMutation.mutate({ chartId, sharedWithGroupId: groupId, permissions: perms })}
                adding={shareGroupMutation.isPending}
                ceiling={myPrivileges}
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
                key={share.sharedWithGroupId} share={share} chartId={chartId}
                onRemove={() => unshareGroupMutation.mutate({ chartId, groupId: share.sharedWithGroupId })}
                removing={unshareGroupMutation.isPending}
                ceiling={myPrivileges}
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
