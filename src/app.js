import express from "express";
import cors from "cors";

import { uploadsRouter } from "./routers/uploads_router.js";
import { excelRouter} from "./routers/excel_router.js";

process.loadEnvFile(); // desde node v21 permite reemplazar a 3as partes (config)

const app = express();
app.use(express.urlencoded({extended:false}));
app.use(express.json());

app.use(cors()); // cors debe ir antes de los routers

app.use("/upload", uploadsRouter);
app.use("/excel", excelRouter);

app.use((req, res) => res.status(404).json({message: "no existe el endpoint"}));

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running http://localhost:${PORT}`));

