/* eslint-disable no-unused-vars */
import { GoogleGenerativeAI } from "@google/generative-ai";

import { join } from "path";
import fs from "fs";

export default class CheckAI {

    static fileToGenerativePart(content, mimeType) {
        return {
          inlineData: {
            data: Buffer.from(content).toString("base64"),
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
        let mimeType = "image/png"
        if (filename.endsWith('.jpeg')) mimeType = "image/jpeg"
        if (filename.endsWith('.pdf')){
            // convertir con pdf2pic a png
        } 

        const filePath = join(projectDir, uploadFolder, filename);
console.log(filePath);

        try {
            // Verificar si el archivo existe
            await fs.promises.access(filePath, fs.constants.F_OK);
            // Leer el contenido del archivo
            const fileContent = await fs.promises.readFile(filePath);
            // Ejecutar la instrucción contra el modelo, pasando el contenido del archivo
            const result = await CheckAI.generate(fileContent, mimeType);
    console.log(result);
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