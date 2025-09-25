import { Permission, type User, type UserUpdate } from "@easy-charts/easycharts-types";
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
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { NavBar } from "../components/NavBar";
import { useUpdateUserMutation } from "../hooks/usersHooks";


export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate()
  const { mutateAsync:updateUserMut, isPending : isUpdateUserPanding, error } = useUpdateUserMutation()
  const [isLoading, setIsLoading] = useState<boolean>(true)

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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh",width:"100Vw" }}>
      <NavBar />
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6">User Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
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
                <IconButton>
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
    </Box>
  );
}
