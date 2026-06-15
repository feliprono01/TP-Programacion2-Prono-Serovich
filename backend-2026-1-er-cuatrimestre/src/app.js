import express from "express";
import morgan from "morgan";


import usuarioRoutes from "./routes/usuario.routes";
import loginRoutes from "./routes/login.routes";
import productoRoutes from "./routes/producto.routes";

const app = express();


app.set("port", 4000);


app.use(morgan("dev"));

app.use(express.json());

//Routes
app.use("/api",usuarioRoutes);
app.use("/api",loginRoutes);
app.use("/api", productoRoutes);






export default app;
