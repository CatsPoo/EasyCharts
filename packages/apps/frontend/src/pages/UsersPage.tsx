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
import { useCreateUserMutation, useUpdateUserMutation } from "../hooks/usersHooks";
import { UserDialog } from "../components/UsersManagment/UserDialog";
import type { SubmitPayload } from "../components/UsersManagment/interfaces";


export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isUserDialogOpen,setUserDialogOpen] = useState<boolean>(false)
  const [editUser,setEditUser] = useState<User | null>(null)

  const { mutateAsync:updateUserMut, isPending : isUpdateUserPanding} = useUpdateUserMutation()
  const { mutateAsync:createUserMut, isPending : isCreateUserPanding} = useCreateUserMutation()

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
    setEditUser(user)
    setUserDialogOpen(true)
  },[])

  const onAddHandle = useCallback(()=>{
    setEditUser(null)
    setUserDialogOpen(true)
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
          refreshTokenHash: "",
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
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh",width:"100Vw" }}>
      <NavBar />
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6">User Management</Typography>
        <Button variant="contained" onClick={() => {setUserDialogOpen(true); setEditUser(null)}} startIcon={<AddIcon />}>
          Create User
        </Button>
      </Toolbar>

      <Table>
        <TableHead>
          <TableRow>
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
            <TableRow key={u.id}>
              <TableCell>{u.username}</TableCell>
              <TableCell>{u.isActive ? "Active" : "Disabled"}</TableCell>
              {Object.values(Permission).map((perm) => (
                <TableCell key={perm}>
                  <Checkbox
                    checked={
                      u.permissions?.includes(perm) ?? false
                    }
                    onChange={() =>
                      togglePermission(
                        u.id,
                        perm,
                        ! u.permissions?.includes(perm)
                      )
                    }
                  />
                </TableCell>
              ))}
              <TableCell>
                <IconButton onClick={() => {setUserDialogOpen(true); setEditUser(u)}}>
                  <EditIcon />
                </IconButton>
                <IconButton color="error">
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box mt={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/charts")}
        >
          Back to Charts
        </Button>
      </Box>
      <LoadingOverlay open={isUpdateUserPanding || isLoading} label="Loading…" />;
      <UserDialog open={isUserDialogOpen} onClose={onUserDialoClose} onSubmit={onUserDialogSubmit} initial={editUser ?? {}}/>
    </Box>
  );
}
