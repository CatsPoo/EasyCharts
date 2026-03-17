import { Permission, type Group, type User, type UserCreate, type UserUpdate } from "@easy-charts/easycharts-types";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PeopleIcon from "@mui/icons-material/People";
import {
    Box,
    Button,
    Checkbox,
    Chip,
    IconButton,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tabs,
    Toolbar,
    Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { useAuth } from "../auth/authProvider";
import { ConfirmDialog } from "../components/DeleteAlertDialog";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { NavBar } from "../components/NavBar";
import { GroupDialog } from "../components/UsersManagment/GroupDialog";
import { UserDialog } from "../components/UsersManagment/UserDialog";
import type { SubmitPayload } from "../components/UsersManagment/interfaces";
import {
    useCreateGroupMutation,
    useDeleteGroupMutation,
    useGroupsQuery,
    useUpdateGroupMutation,
} from "../hooks/groupsHooks";
import { useCreateUserMutation, useDeleteUserMutation, useUpdateUserMutation } from "../hooks/usersHooks";

// ─── Table row styles ─────────────────────────────────────────────────────────

const headRowSx = (t: { palette: { mode: string; divider: string; text: { primary: string } } }) => ({
    bgcolor: t.palette.mode === "dark" ? "background.paper" : "#e0e7ff",
    "& .MuiTableCell-root": {
        borderBottom: t.palette.mode === "dark" ? `1px solid ${t.palette.divider}` : "1px solid #c7d2fe",
        color: t.palette.mode === "dark" ? t.palette.text.primary : "#4338ca",
        fontWeight: 700,
        fontSize: 13,
    },
});

const bodyRowSx = (t: { palette: { mode: string; divider: string } }) => ({
    "&:last-child .MuiTableCell-root": { borderBottom: 0 },
    "& .MuiTableCell-root": {
        borderBottom: t.palette.mode === "dark" ? `1px solid ${t.palette.divider}` : "1px solid #e0e7ff",
    },
    "&:hover": {
        bgcolor: t.palette.mode === "dark" ? "rgba(99,102,241,0.06)" : "#eef2ff",
    },
});

const tableBorderSx = (t: { palette: { mode: string; divider: string } }) => ({
    mx: 2,
    borderRadius: 2,
    overflow: "hidden",
    border: t.palette.mode === "dark" ? `1px solid ${t.palette.divider}` : "1px solid #c7d2fe",
});

// ─── Users tab ────────────────────────────────────────────────────────────────

function UsersTab() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUserDialogOpen, setUserDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);

    const { user: currentUser } = useAuth();
    const { mutateAsync: updateUserMut, isPending: isUpdateUserPending } = useUpdateUserMutation();
    const { mutateAsync: createUserMut } = useCreateUserMutation();
    const { mutateAsync: deleteUserMut, isPending: isDeleteUserPending } = useDeleteUserMutation();

    const updateUser = useCallback(async (userId: string, payload: UserUpdate) => {
        const updated: User = await updateUserMut({ id: userId, data: payload });
        setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    }, [updateUserMut]);

    useEffect(() => {
        setIsLoading(true);
        http.get<User[]>("/users").then(res => { setUsers(res.data); setIsLoading(false); });
    }, []);

    const togglePermission = async (userId: string, perm: Permission, has: boolean) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        if (!has) user.permissions = user.permissions.filter(p => p !== perm);
        else if (!user.permissions.find(p => p === perm)) user.permissions.push(perm);
        try {
            const updated: User = await updateUserMut({ id: userId, data: { permissions: user.permissions } });
            setUsers(prev => prev.map(u => u.id === userId ? updated : u));
        } catch { throw new Error("unable to change user permission"); }
    };

    const onUserDialogSubmit = useCallback(async (payload: SubmitPayload) => {
        const { username, password, isActive, permissions } = payload;
        try {
            if (editUser) {
                await updateUser(editUser.id, { username, password, isActive, permissions } as UserUpdate);
            } else {
                const newUser: User = await createUserMut({
                    data: { username, password: password ?? "", displayName: username, isActive, permissions } as UserCreate,
                });
                setUsers(prev => [...prev, newUser]);
            }
            setEditUser(null);
            setUserDialogOpen(false);
        } catch { /* empty */ }
    }, [createUserMut, editUser, updateUser]);

    const onDeleteDialogConfirm = useCallback(async () => {
        if (!editUser?.id) return;
        try {
            await deleteUserMut({ id: editUser.id });
            setUsers(prev => prev.filter(u => u.id !== editUser.id));
            setEditUser(null);
            setDeleteDialogOpen(false);
        } catch { /* empty */ }
    }, [deleteUserMut, editUser]);

    return (
        <>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6">Users</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditUser(null); setUserDialogOpen(true); }}>
                    Create User
                </Button>
            </Toolbar>
            <Box sx={tableBorderSx}>
                <Table>
                    <TableHead>
                        <TableRow sx={headRowSx}>
                            <TableCell>User</TableCell>
                            <TableCell>Status</TableCell>
                            {Object.values(Permission).map(perm => <TableCell key={perm}>{perm}</TableCell>)}
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map(u => (
                            <TableRow key={u.id} sx={bodyRowSx}>
                                <TableCell>{u.username}</TableCell>
                                <TableCell>{u.isActive ? "Active" : "Disabled"}</TableCell>
                                {Object.values(Permission).map(perm => (
                                    <TableCell key={perm}>
                                        <Checkbox
                                            checked={u.permissions?.includes(perm) ?? false}
                                            onChange={() => togglePermission(u.id, perm, !u.permissions?.includes(perm))}
                                        />
                                    </TableCell>
                                ))}
                                <TableCell>
                                    <IconButton onClick={() => { setEditUser(u); setUserDialogOpen(true); }}><EditIcon /></IconButton>
                                    {u.id !== currentUser?.id && (
                                        <IconButton color="error" onClick={() => { setEditUser(u); setDeleteDialogOpen(true); }}>
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>
            <LoadingOverlay open={isUpdateUserPending || isDeleteUserPending || isLoading} label="Loading…" />
            <UserDialog
                open={isUserDialogOpen}
                onClose={() => { setEditUser(null); setUserDialogOpen(false); }}
                onSubmit={onUserDialogSubmit}
                initial={editUser ?? {}}
            />
            <ConfirmDialog
                open={isDeleteDialogOpen}
                onCancel={() => { setEditUser(null); setDeleteDialogOpen(false); }}
                onConfirm={onDeleteDialogConfirm}
                confirmColor="error"
                title="Are you sure you want to delete user"
            />
        </>
    );
}

// ─── Groups tab ───────────────────────────────────────────────────────────────

function GroupsTab() {
    const [isGroupDialogOpen, setGroupDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editGroup, setEditGroup] = useState<Group | null>(null);

    const { data: groups = [], isLoading } = useGroupsQuery();
    const createGroupMut = useCreateGroupMutation();
    const updateGroupMut = useUpdateGroupMutation();
    const { mutateAsync: deleteGroupMut, isPending: isDeleting } = useDeleteGroupMutation();

    const onGroupDialogSubmit = useCallback(async (data: { name: string; description: string }) => {
        if (editGroup) {
            await updateGroupMut.mutateAsync({ id: editGroup.id, data });
        } else {
            await createGroupMut.mutateAsync(data);
        }
        setEditGroup(null);
        setGroupDialogOpen(false);
    }, [createGroupMut, editGroup, updateGroupMut]);

    const onDeleteConfirm = useCallback(async () => {
        if (!editGroup) return;
        try {
            await deleteGroupMut(editGroup.id);
            setEditGroup(null);
            setDeleteDialogOpen(false);
        } catch { /* empty */ }
    }, [deleteGroupMut, editGroup]);

    return (
        <>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6">Groups</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditGroup(null); setGroupDialogOpen(true); }}>
                    Create Group
                </Button>
            </Toolbar>
            <Box sx={tableBorderSx}>
                <Table>
                    <TableHead>
                        <TableRow sx={headRowSx}>
                            <TableCell>Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Members</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {groups.map(g => (
                            <TableRow key={g.id} sx={bodyRowSx}>
                                <TableCell>{g.name}</TableCell>
                                <TableCell>{g.description}</TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        icon={<PeopleIcon />}
                                        label={g.memberCount}
                                        onClick={() => { setEditGroup(g); setGroupDialogOpen(true); }}
                                        sx={{ cursor: "pointer" }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton onClick={() => { setEditGroup(g); setGroupDialogOpen(true); }}><EditIcon /></IconButton>
                                    <IconButton color="error" onClick={() => { setEditGroup(g); setDeleteDialogOpen(true); }}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {groups.length === 0 && !isLoading && (
                            <TableRow>
                                <TableCell colSpan={4} sx={{ textAlign: "center", color: "text.secondary", py: 3 }}>
                                    No groups yet. Create one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Box>
            <LoadingOverlay open={isLoading || isDeleting} label="Loading…" />
            <GroupDialog
                open={isGroupDialogOpen}
                onClose={() => { setEditGroup(null); setGroupDialogOpen(false); }}
                onSubmit={onGroupDialogSubmit}
                initial={editGroup ?? undefined}
            />
            <ConfirmDialog
                open={isDeleteDialogOpen}
                onCancel={() => { setEditGroup(null); setDeleteDialogOpen(false); }}
                onConfirm={onDeleteConfirm}
                confirmColor="error"
                title={`Delete group "${editGroup?.name}"?`}
            />
        </>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function UsersPage() {
    const [tab, setTab] = useState(0);
    const navigate = useNavigate();

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw" }}>
            <NavBar />
            <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
                <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
                    <Tab label="Users" />
                    <Tab label="Groups" />
                </Tabs>
            </Box>
            <Box sx={{ flex: 1, overflow: "auto" }}>
                {tab === 0 && <UsersTab />}
                {tab === 1 && <GroupsTab />}
            </Box>
            <Box mt={2} px={2} pb={2}>
                <Button onClick={() => navigate("/charts")}>Back to Charts</Button>
            </Box>
        </Box>
    );
}
