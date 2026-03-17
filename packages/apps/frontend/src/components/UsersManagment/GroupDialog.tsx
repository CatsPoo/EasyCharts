import type { Group } from "@easy-charts/easycharts-types";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
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
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  useAddGroupMemberMutation,
  useGroupMembersQuery,
  useRemoveGroupMemberMutation,
} from "../../hooks/groupsHooks";
import { useUsersSearchQuery } from "../../hooks/usersHooks";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string }) => Promise<void>;
  initial?: Partial<Group>;
}

export function GroupDialog({ open, onClose, onSubmit, initial }: Props) {
  const isEdit = !!initial?.id;
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
      setMemberSearch("");
      setDebouncedSearch("");
    }
  }, [open, initial]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(memberSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [memberSearch]);

  const { data: members = [], isLoading: membersLoading } = useGroupMembersQuery(isEdit ? initial.id! : null);
  const { data: searchResults = [], isFetching: searching } = useUsersSearchQuery(debouncedSearch);
  const addMemberMut = useAddGroupMemberMutation();
  const removeMemberMut = useRemoveGroupMemberMutation();

  const memberIds = new Set(members.map(m => m.id));
  const filteredResults = searchResults.filter(u => !memberIds.has(u.id));

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Group" : "Create Group"}</DialogTitle>
      <DialogContent sx={{ px: 2, pb: 1 }}>

        {/* Name & description */}
        <TextField
          fullWidth
          label="Group name"
          value={name}
          onChange={e => setName(e.target.value)}
          size="small"
          sx={{ mt: 1, mb: 1.5 }}
          required
        />
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          size="small"
          multiline
          rows={2}
          sx={{ mb: 1.5 }}
        />

        {/* Members section — only shown when editing */}
        {isEdit && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Members</Typography>

            {/* Member search */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search users to add…"
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {searching ? <CircularProgress size={14} /> : <SearchIcon fontSize="small" />}
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />

            {/* Search results */}
            {filteredResults.length > 0 && (
              <List dense disablePadding sx={{ mb: 1 }}>
                {filteredResults.map(u => (
                  <ListItem
                    key={u.id}
                    disablePadding
                    sx={{ py: 0.25 }}
                    secondaryAction={
                      <IconButton
                        size="small"
                        onClick={() => addMemberMut.mutate({ groupId: initial.id!, userId: u.id })}
                        disabled={addMemberMut.isPending}
                      >
                        <PersonAddIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar sx={{ minWidth: 36 }}>
                      <Avatar sx={{ width: 26, height: 26, fontSize: 12 }}>
                        {(u.displayName || u.username)[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={u.displayName || u.username}
                      secondary={u.displayName ? u.username : undefined}
                      primaryTypographyProps={{ fontSize: 13 }}
                      secondaryTypographyProps={{ fontSize: 11 }}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            {/* Current members */}
            {membersLoading ? (
              <Box sx={{ display: "grid", placeItems: "center", py: 1 }}>
                <CircularProgress size={20} />
              </Box>
            ) : members.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, py: 0.5 }}>
                No members yet. Search above to add users.
              </Typography>
            ) : (
              <List dense disablePadding>
                {members.map(m => (
                  <ListItem
                    key={m.id}
                    disablePadding
                    sx={{ py: 0.25 }}
                    secondaryAction={
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeMemberMut.mutate({ groupId: initial.id!, userId: m.id })}
                        disabled={removeMemberMut.isPending}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar sx={{ minWidth: 36 }}>
                      <Avatar sx={{ width: 26, height: 26, fontSize: 12 }}>
                        {(m.displayName || m.username)[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={m.displayName || m.username}
                      secondary={m.displayName ? m.username : undefined}
                      primaryTypographyProps={{ fontSize: 13 }}
                      secondaryTypographyProps={{ fontSize: 11 }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || !name.trim()}
        >
          {saving ? <CircularProgress size={18} /> : isEdit ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
