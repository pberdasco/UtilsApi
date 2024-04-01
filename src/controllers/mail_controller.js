import { createTransport } from 'nodemailer';
import { decrypt } from './cript_aux.js';

let transporter = null;
let currentCredentials = null;

async function getEncryptedConfig(req, res) {
    try {
        //TODO: credenciales encriptadas ahora en variables de entorno. Quizas convenga mandarlas a BD o similar.
        // tambien (si van a bd) ver si se implementa algo para no buscarlas todo el tiempo (cache o algo asi)
        const credentials = {
            user: decrypt(process.env.MAIL_U),  
            pass: decrypt(process.env.MAIL_P)   
        };
        return credentials
    } catch (error) {
        console.error("Error al obtener las credenciales:", error);
        throw new Error("Error al obtener las credenciales");
    }
} 

export default class MailController {

    static async send(req, res, next){
        try {
            // captura y validacion de los parametros en el body
            const { to, subject, text, html } = req.body;
            if (!to || !subject || !text) {
                return res.status(400).json({ success: false, error: "Faltan campos obligatorios" });
                //TODO: probar si el from tambien se puede pedir para poner uno diferente al de las credenciales...
            }

            // busco las credenciales encriptadas. si no las tengo la api no puede responder
            const newCredentials = await getEncryptedConfig();

            // si aun no cree el transporter o cambiaron las credenciales debo crearlo
            if (!transporter || newCredentials.email !== currentCredentials.email || newCredentials.password !== currentCredentials.password) {
                    currentCredentials = newCredentials;
                    transporter = createTransport({
                        service: 'gmail',
                        auth: {
                            user: newCredentials.user,
                            pass: newCredentials.pass,
                        },
                    });
            }

            const mailOptions = {
                from: currentCredentials.email,
                to,
                subject,
                text,
            };
            // html como opcional
            if (html) {
                mailOptions.html = html;
            }

            await transporter.sendMail(mailOptions);
            
            res.json({ success: true });
        }catch (error){
            console.error("Ocurrió un error al enviar el correo electrónico:", error);
            res.status(500).json({ success: false, error: "Ocurrió un error al enviar el correo electrónico" });
        }
    }
}