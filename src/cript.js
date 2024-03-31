// herramienta auxiliar para crear usuario y clave encriptados para copiarlos al .env

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
const algorithm = 'aes-256-cbc';

process.loadEnvFile();
const key = process.env.CRIPT_KEY; // la clave debe tener exactamente 32 caracteres

// Función para encriptar
function encrypt(text) {
    const iv = randomBytes(16);
    const cipher = createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Función para desencriptar
function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// Ejemplo de uso
const encryptedUser = encrypt('p.berdasco@gmail.com')
const encryptedKey = encrypt('olstfkinadyvvcgt');
const decryptedUser = decrypt(encryptedUser);
const decryptedKey = decrypt(encryptedKey);
console.log('Usuario:', decryptedUser, " - ", encryptedUser);
console.log('Key:', decryptedKey, " - ", encryptedKey);

