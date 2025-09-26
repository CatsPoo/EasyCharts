import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./AppRoute";


export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
