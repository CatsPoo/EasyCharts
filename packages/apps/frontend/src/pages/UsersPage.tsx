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
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http"
import { type User,Permission, type UserUpdate } from "@easy-charts/easycharts-types";
import { useNavigate } from "react-router-dom";
import { NavBar } from "../components/NavBar";


export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate()

  useEffect(() => {
    http.get<User[]>("/users").then((res) => setUsers(res.data));
  }, []);

  const togglePermission = async (userId: string, perm: Permission, has: boolean) => {
    const user : User | undefined = users.find(u=>u.id === userId)
    if(!user) return

    if(!has) user.permissions = user.permissions.filter(p => p === perm)
    else if(!user.permissions.find(p=> p === perm)) user.permissions.push(perm)

    try{
        const updateUserPayload : UserUpdate = {
            permissions:user.permissions
        }
        const {data:updatedUser} = await http.patch<User>(`/users/${userId}`,updateUserPayload)
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
    </Box>
  );
}
