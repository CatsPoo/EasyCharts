import type { ChartShare } from "@easy-charts/easycharts-types";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
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
  useChartSharesQuery,
  useShareChartMutation,
  useUnshareChartMutation,
} from "../../hooks/chartsDirectoriesHooks";
import { useUserByIdQuery, useUsersSearchQuery } from "../../hooks/usersHooks";

interface Props {
  open: boolean;
  onClose: () => void;
  chartId: string;
}

function ShareRow({
  share,
  onRemove,
  removing,
}: {
  share: ChartShare;
  onRemove: () => void;
  removing: boolean;
}) {
  const { data: user } = useUserByIdQuery(share.sharedWithUserId);
  const label = user?.displayName || user?.username || share.sharedWithUserId;
  const sub = user?.displayName ? user.username : undefined;

  return (
    <ListItem
      secondaryAction={
        <IconButton edge="end" size="small" onClick={onRemove} disabled={removing}>
          <PersonRemoveIcon fontSize="small" color="error" />
        </IconButton>
      }
    >
      <ListItemAvatar>
        <Avatar sx={{ width: 30, height: 30, fontSize: 13 }}>
          {label[0].toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={label}
        secondary={sub}
        primaryTypographyProps={{ fontSize: 13 }}
        secondaryTypographyProps={{ fontSize: 11 }}
      />
    </ListItem>
  );
}

export function ShareChartDialog({ open, onClose, chartId }: Props) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchInput("");
      setDebouncedQ("");
    }
  }, [open]);

  const { data: shares = [], isLoading: sharesLoading } = useChartSharesQuery(open ? chartId : null);
  const { data: searchResults = [], isFetching: searching } = useUsersSearchQuery(debouncedQ);

  const shareMutation = useShareChartMutation();
  const unshareMutation = useUnshareChartMutation();

  const sharedIds = new Set(shares.map((s) => s.sharedWithUserId));
  const filteredResults = searchResults.filter((u) => !sharedIds.has(u.id));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Share chart</DialogTitle>
      <DialogContent sx={{ px: 2, pt: 1, pb: 0 }}>

        {/* Search bar */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search users…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {searching
                  ? <CircularProgress size={16} />
                  : <SearchIcon fontSize="small" />
                }
              </InputAdornment>
            ),
          }}
          sx={{ mt: 0.5, mb: 1 }}
        />

        {/* Search results */}
        {filteredResults.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
              Add user
            </Typography>
            <List dense disablePadding sx={{ mb: 1 }}>
              {filteredResults.map((user) => (
                <ListItem
                  key={user.id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => shareMutation.mutate({ chartId, sharedWithUserId: user.id })}
                      disabled={shareMutation.isPending}
                    >
                      <PersonAddIcon fontSize="small" color="primary" />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 30, height: 30, fontSize: 13 }}>
                      {(user.displayName || user.username)[0].toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.displayName || user.username}
                    secondary={user.displayName ? user.username : undefined}
                    primaryTypographyProps={{ fontSize: 13 }}
                    secondaryTypographyProps={{ fontSize: 11 }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {/* Already shared with */}
        {sharesLoading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : shares.length > 0 ? (
          <>
            {filteredResults.length > 0 && <Divider sx={{ mb: 1 }} />}
            <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
              Shared with
            </Typography>
            <List dense disablePadding>
              {shares.map((share) => (
                <ShareRow
                  key={share.sharedWithUserId}
                  share={share}
                  onRemove={() =>
                    unshareMutation.mutate({ chartId, sharedWithUserId: share.sharedWithUserId })
                  }
                  removing={unshareMutation.isPending}
                />
              ))}
            </List>
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
