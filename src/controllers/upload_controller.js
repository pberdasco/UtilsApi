/* eslint-disable no-unused-vars */
import multer from "multer";
import { join } from "path";
import fs from "fs";

export default class UploadController {

    static async uploadFile(req, res, next){
        const uploadFolder = process.env.UPLOAD_FILES;
        const uploadFieldName = "file";

        // Configurar Multer para manejar la carga de archivos
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, uploadFolder); 
            },
            filename: (req, file, cb) => {
                const timestamp = Date.now(); // Agrega una marca de tiempo para hacer el nombre único
                cb(null, `${timestamp}-${file.originalname}`);
            },
        });

        const upload = multer({ storage: storage }).single(uploadFieldName);

        upload(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                // Error de Multer (p. ej., archivo demasiado grande, tipo no permitido)
                console.error("Error de Multer:", err.message);
                return res.status(400).json({ error: err.message });
            } else if (err) {
                console.error("Error de carga de archivo:", err.message);
                return res.status(500).json({ error: "Error al cargar el archivo." });
            }
            if (!req.file) {
                console.log("Error carga de archivo ", uploadFieldName);
                return res.status(400).send("No se seleccionó ningún archivo.");
            }
       
            const uploadedFile = req.file;
            const filePath = uploadedFile.path;
            console.log("Archivo cargado ", filePath, uploadedFile.filename);
    
            // Devuelve información sobre el archivo cargado
            res.status(200).json({
                originalname: uploadedFile.originalname,
                filename: uploadedFile.filename,
                path: filePath,
                message: "Archivo cargado con éxito"
            });
        });

    }

    static async uploadBase64(req, res, next){
        const uploadFolder = process.env.UPLOAD_IMAGES;

        try {
            const imagenBase64 = req.body.imagen; // Suponiendo que el cuerpo de la solicitud contiene la imagen en base64
            
            const base64Data = imagenBase64.replace(/^data:image\/jpeg;base64,/, "");
            const binaryData = Buffer.from(base64Data, "base64");
        
            const FileName = `Photo-${Date.now()}.jpg`;
            const uploadFileName = join(uploadFolder, FileName);

            fs.writeFile(uploadFileName, binaryData, "binary", (err) => {
                if (err) {
                    console.error("Error al guardar la imagen:", err);
                    res.status(500).send("Error al guardar la imagen");
                } else {
                    console.log("Imagen guardada con éxito en", uploadFileName);
                    res.status(200).json({
                        filename: FileName,
                        path: uploadFileName,
                        message: "Imagen guardada con éxito"
                    });
                }
            });
        } catch (error) {
            console.error("Error en la solicitud:", error);
            res.status(400).send("Error en la solicitud");
        }
    }

    static async deleteFile(req, res, next){
        const projectDir = process.env.PROJECT_DIR;
        const uploadFolder = process.env.UPLOAD_IMAGES;
        const { filename } = req.params;
        
        const filePath = join(projectDir, uploadFolder, filename);

        try {
            // Eliminar el archivo
            await fs.promises.unlink(filePath);

            console.log("Archivo eliminado:", filePath);
            res.status(200).send("Archivo eliminado correctamente");
        } catch (error) {
            console.error("Error al intentar eliminar el archivo:", error);
            res.status(500).send("Error al intentar eliminar el archivo");
        }
    }
    
    static async getFile(req, res, next){
        const projectDir = process.env.PROJECT_DIR;
        const uploadFolder = process.env.UPLOAD_IMAGES;
        const { filename } = req.params;
        
        const filePath = join(projectDir, uploadFolder, filename);

        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            res.sendFile(filePath);
        } catch (error) {
            console.error("El archivo no existe:", error);
            res.status(404).send("El archivo no existe");
        }
    }

}