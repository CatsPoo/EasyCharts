import { Permission, type User, type UserCreate, type UserUpdate } from "@easy-charts/easycharts-types";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
    Box,
    Button,
    Checkbox,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Toolbar,
    Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { NavBar } from "../components/NavBar";
import { useCreateUserMutation, useDeleteUserMutation, useUpdateUserMutation } from "../hooks/usersHooks";
import { UserDialog } from "../components/UsersManagment/UserDialog";
import type { SubmitPayload } from "../components/UsersManagment/interfaces";
import { ConfirmDialog } from "../components/DeleteAlertDialog";
import { useAuth } from "../auth/authProvider";


export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isUserDialogOpen,setUserDialogOpen] = useState<boolean>(false)
  const [isDeleteDialogOpen,setDeleteDialogOpen] = useState<boolean>(false)
  const [editUser,setEditUser] = useState<User | null>(null)

  const navigate = useNavigate()

  const {user} = useAuth()

  const { mutateAsync:updateUserMut, isPending : isUpdateUserPanding} = useUpdateUserMutation()
  const { mutateAsync:createUserMut } = useCreateUserMutation()
  const { mutateAsync:deleteUserMut, isPending : isDeleteUserPanding} = useDeleteUserMutation()

  const updateUser = useCallback(
    async (userId:string, updateUserPayload: UserUpdate) : Promise<void>=> {
      const updatedUser: User = await updateUserMut({
        id: userId,
        data: updateUserPayload,
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    },
    [updateUserMut]
  );
  useEffect(() => {
    setIsLoading(true)
    http.get<User[]>("/users").then((res) => {
      setUsers(res.data);
      setIsLoading(false)
    });
  }, []);

  const togglePermission = async (userId: string, perm: Permission, has: boolean) => {
    const user : User | undefined = users.find(u=>u.id === userId)
    if(!user) return

    if(!has) user.permissions = user.permissions.filter(p => p !== perm)
    else if(!user.permissions.find(p=> p === perm)) user.permissions.push(perm)

    try{
        const updateUserPayload : UserUpdate = {
            permissions:user.permissions
        }
        const updatedUser: User = await updateUserMut({
          id: userId,
          data: updateUserPayload,
        });
        setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    }catch{
        throw new Error('unable to change user permition')
    }
  };

  const onEditHandle = useCallback((user:User)=>{
    setUserDialogOpen(true);
    setEditUser(user);
  },[])

  const onAddHandle = useCallback(()=>{
    setUserDialogOpen(true);
    setEditUser(null);
  },[])

  const onDeleteHandle = useCallback((user:User)=>{
    setEditUser(user)
    setDeleteDialogOpen(true)

  },[])

  const onDeleteDialogConfirm = useCallback(async () => {
    if (!editUser?.id) return;
    try {
      await deleteUserMut({ id: editUser?.id });
      setUsers(prev=>prev.filter(u=>u.id !== editUser.id))
      setEditUser(null)
      setDeleteDialogOpen(false);
    } catch {
      /* empty */
    }
  }, [deleteUserMut, editUser]);

  const onDeleteDialogClose = useCallback(()=>{
    setEditUser(null)
    setDeleteDialogOpen(false)
  },[])

  const onUserDialogSubmit = useCallback( async (payload : SubmitPayload) => {
    const {username,password,isActive,permissions} = payload
    try {
      if (editUser) {
        const updateUserPayload: UserUpdate = {
          username,
          password,
          isActive,
          permissions,
        };
        await updateUser(editUser.id, updateUserPayload);
      } else {
        const createUserPayload: UserCreate = {
          username,
          password: password ?? "",
          displayName: username,
          isActive,
          permissions,
        };

        const newUser: User = await createUserMut({
          data: createUserPayload,
        });
        setUsers((prev) => [...prev, newUser]);
      }
      setEditUser(null)
      setUserDialogOpen(false)
    } catch { /* empty */ }
  }, [createUserMut, editUser, updateUser]);

  const onUserDialoClose = useCallback(()=>{
    setEditUser(null)
    setUserDialogOpen(false)
  },[])

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100Vw",
      }}
    >
      <NavBar />
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6">User Management</Typography>
        <Button
          variant="contained"
          onClick={onAddHandle}
          startIcon={<AddIcon />}
        >
          Create User
        </Button>
      </Toolbar>
      <Box
        sx={(t) => ({
          mx: 2,
          borderRadius: 2,
          overflow: "hidden",
          border: t.palette.mode === "dark"
            ? `1px solid ${t.palette.divider}`
            : "1px solid #c7d2fe",
        })}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={(t) => ({
                bgcolor: t.palette.mode === "dark" ? "background.paper" : "#e0e7ff",
                "& .MuiTableCell-root": {
                  borderBottom: t.palette.mode === "dark"
                    ? `1px solid ${t.palette.divider}`
                    : "1px solid #c7d2fe",
                  color: t.palette.mode === "dark" ? t.palette.text.primary : "#4338ca",
                  fontWeight: 700,
                  fontSize: 13,
                },
              })}
            >
              <TableCell>User</TableCell>
              <TableCell>Status</TableCell>
              {Object.values(Permission).map((perm) => (
                <TableCell key={perm}>{perm}</TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow
                key={u.id}
                sx={(t) => ({
                  "&:last-child .MuiTableCell-root": { borderBottom: 0 },
                  "& .MuiTableCell-root": {
                    borderBottom: t.palette.mode === "dark"
                      ? `1px solid ${t.palette.divider}`
                      : "1px solid #e0e7ff",
                  },
                  "&:hover": {
                    bgcolor: t.palette.mode === "dark"
                      ? "rgba(99,102,241,0.06)"
                      : "#eef2ff",
                  },
                })}
              >
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.isActive ? "Active" : "Disabled"}</TableCell>
                {Object.values(Permission).map((perm) => (
                  <TableCell key={perm}>
                    <Checkbox
                      checked={u.permissions?.includes(perm) ?? false}
                      onChange={() =>
                        togglePermission(
                          u.id,
                          perm,
                          !u.permissions?.includes(perm)
                        )
                      }
                    />
                  </TableCell>
                ))}
                <TableCell>
                  <IconButton onClick={() => onEditHandle(u)}>
                    <EditIcon />
                  </IconButton>
                  {u.id !== user?.id && (
                    <IconButton color="error" onClick={() => onDeleteHandle(u)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Box mt={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/charts")}
        >
          Back to Charts
        </Button>
      </Box>
      <LoadingOverlay
        open={
          isUpdateUserPanding ||
          isUpdateUserPanding ||
          isDeleteUserPanding ||
          isLoading
        }
        label="Loading…"
      />
      ;
      <UserDialog
        open={isUserDialogOpen}
        onClose={onUserDialoClose}
        onSubmit={onUserDialogSubmit}
        initial={editUser ?? {}}
      />
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onCancel={onDeleteDialogClose}
        onConfirm={onDeleteDialogConfirm}
        confirmColor="error"
        title='Are you shure you want to delete user'
      />
    </Box>
  );
}
