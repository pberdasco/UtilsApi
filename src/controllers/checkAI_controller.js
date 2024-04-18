// En deploy recordar instalar estas dependencias
// # Instalar dependencias requeridas
// RUN apt-get update && apt-get install -y \
//     graphicsmagick \
//     ghostscript \
//     && rm -rf /var/lib/apt/lists/*
//  y setear los path a los directorios bin de ambos.

/* eslint-disable no-unused-vars */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fromPath as pdf2picFromPath } from "pdf2pic";

import { join } from "path";
import fs from "fs";

export default class CheckAI {

    static saveBase64Image(base64String, filePath) {
        // Remover la parte del encabezado del base64 (por ejemplo, "data:image/png;base64,")
        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    
        // Decodificar el base64 a datos binarios
        const imageData = Buffer.from(base64Data, 'base64');
    
        // Guardar los datos binarios en un archivo
        fs.writeFile(filePath, imageData, 'binary', (err) => {
            if (err) {
                console.error('Error al guardar la imagen:', err);
            } else {
                console.log('La imagen se ha guardado correctamente en', filePath);
            }
        });
    }

    static async pdfToPng(pdfFilePath) {
        const tempDir = join(process.env.PROJECT_DIR, process.env.TEMP_FILES);
        const randomNumber = Math.floor(Math.random() * 100000); // Genera un número aleatorio entre 0 y 99999
        const filenamePrefix = "image";
        const filename = `${filenamePrefix}-${randomNumber}.png`;

        // Configurar pdf2pic
        const options = {
            density: 100,           // Resolución de la imagen
            saveFilename: filename, // Nombre de archivo de salida
            savePath: tempDir,      // Ruta donde se guardarán las imágenes
            format: "png",          // Formato de salida
            width: 850,             // Ancho de la imagen en píxeles
            height: 1100            // Alto de la imagen en píxeles
        };

        try{
            // Inicializar pdf2pic con las opciones
            const convertPdfToPng = pdf2picFromPath(pdfFilePath, options);

            // Convertir PDF a imagen PNG (la pagina 1 a base64)
            const output = await convertPdfToPng(1, { responseType: "base64" }); 
            
            const filePath = "output.png"; // Ruta del archivo de salida (con extensión .png)
            CheckAI.saveBase64Image(output.base64, filePath);

            return output.base64;
        }catch(error) {
            console.error("Error durante la conversión del PDF a PNG:", error);
            throw error;
        }
      
    }

    static fileToGenerativePart(content, mimeType) {
        return {
          inlineData: {
            // data: Buffer.from(content).toString("base64"),
            data: content,
            mimeType
          },
        };
    }

    static cleanJSON(text){
        const openingBraceIndex = text.indexOf('{'); // Encuentra el índice del primer '{'
        const closingBraceIndex = text.lastIndexOf('}'); // Encuentra el índice del último '}'

        // Verifica si se encontraron ambas llaves
        if (openingBraceIndex !== -1 && closingBraceIndex !== -1) {
            const cleanedText = text.substring(openingBraceIndex, closingBraceIndex + 1); // Extrae el texto entre las llaves
            return JSON.parse(cleanedText);
        }else{
            return { status: 500, message: "No JSON from AI" };
        }
    }

    static async generate(file, mimeType){
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
      
        const prompt = "1) Analizar si la imagen corresponde a una factura de venta. 2) Indicar en formato json " + 
            "{esFactura: boolean, // true si es una factura, false si no " +
            "fecha: date (AAAA-MM-DD), // la fecha de la factura o null si n es una factura " +
            "tieneItemElectrodomestico: boolean,  // true si es una factura y una de las descripciones de sus items corresponde a algun electrodomestico, false si no es asi " + 
            "textoItemElectrodomestico: string} // el texto del item si tieneItemElectrodomestico==true o 'No tiene' si es false";

        const imageParts = [CheckAI.fileToGenerativePart(file, mimeType),];
      
        try{
            const result = await model.generateContent([prompt, ...imageParts]);
            const response = await result.response;
            return CheckAI.cleanJSON(response.text());
        }catch(error){
            console.log("Error en llamada a GoogleGenerative: ", error)
            return {status: 500, message: error}
        }
        
    }

    static async factura(req, res, next){
        const projectDir = process.env.PROJECT_DIR;
        const uploadFolder = process.env.UPLOAD_IMAGES;
        const { filename } = req.params;
        // Ajustar por tipo de archivo (png / jpeg / pdf)
        let mimeType = "image/png"  // si es pdf lo deja en image/png porque lo va a convertir
        if (filename.endsWith('.jpeg')) mimeType = "image/jpeg"
        const filePath = join(projectDir, uploadFolder, filename);

        try {
            // Leer el contenido del archivo
            let fileContent
            if (filename.endsWith('.pdf')){
                fileContent = await CheckAI.pdfToPng(filePath);
            }else {
                fileContent = await fs.promises.readFile(filePath, "base64");
            }
            
            // Ejecutar la instrucción contra el modelo, pasando el contenido del archivo
            const result = await CheckAI.generate(fileContent, mimeType);
            res.json(result)
        } catch (error) {
            console.error("Error en CheckAI.factura:", error);
            res.status(500).send("Error al intentar procesar el archivo con AI");
        }
    }

    static async electrodomestico(req, res, next){
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