/* eslint-disable no-unused-vars */
//https://www.npmjs.com/package/xlsx#acquiring-and-extracting-data
//https://www.npmjs.com/package/xlsx#json

import * as XLSX from "xlsx/xlsx.mjs";
import * as fs from "fs";
import { join } from "path";
import {styleText} from "node:util";

function findHeaderRow(sheet, targetValue) {
    // Recorrer las celdas de la hoja hasta encontrar el valor objetivo
    // IMPORTANTE: el valor objetivo podrá ser cualquier nombre de campo (encabezado)
    //             porque igualmente seleccionara el rango completo
    //             por ello ese nombre no debe estar solo en una celda anterior
    const range = XLSX.utils.decode_range(sheet["!ref"]); // Tomar el rango
    for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
            const cellAddress = XLSX.utils.encode_cell({ r, c });
            const cellValue = sheet[cellAddress] ? sheet[cellAddress].v : "";
            if (cellValue === targetValue) {
                return r; 
            }
        }
    }
    return null; // Si no se encuentra el valor, devuelve null
}

function getSheetWithHeader(sheet, startRow) {
    // Define el rango de celdas que contienen los datos (ignora las filas anteriores)
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    range.s.r = startRow;
  
    // Crea un nuevo objeto de hoja de cálculo con el rango modificado
    const newSheet = Object.assign({}, sheet);
    newSheet["!ref"] = XLSX.utils.encode_range(range);
  
    return newSheet;
}

export default class ExcelController {

    static async getSheet(req, res, next) {
        console.log(styleText("blue", "Ejecutando ExcelController.getSheet"));
        try{
            XLSX.set_fs(fs);
            const excelFileName = req.params.file;
            const firstField = req.params.firstfield || process.env.EXCELS_FIRST_FIELD;
            const excelFullFileName = join(process.env.EXCELS_DIR, excelFileName);

            const workbook = XLSX.readFile(excelFullFileName);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

            const headerRow = findHeaderRow(firstSheet, firstField);
            if (headerRow !== null) {
                const sheetWithHeader = getSheetWithHeader(firstSheet, headerRow);
                const jsonSheet = XLSX.utils.sheet_to_json(sheetWithHeader);
                res.status(200).json(jsonSheet);
            } else{
                res.status(400).send(`no se encontro el campo ${firstField} que define el inicio de la tabla`);
            }
        } catch (err){
            console.log(err);
            res.status(500).send(`Error en el servidor: ${err}`);
        }
    }

    static async upload(req, res, next) {
    }
}