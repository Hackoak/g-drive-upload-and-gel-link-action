"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions = require("@actions/core");
const archiver = require("archiver");
const fs = require("fs");
const googleapis_1 = require("googleapis");
const credentials = actions.getInput('credentials', { required: true });
const folder = actions.getInput('folder', { required: true });
const target = actions.getInput('target', { required: true });
const name = actions.getInput('name', { required: false });
const link = 'link';
const CREDENTIALS_JSON = JSON.parse(Buffer.from(credentials, 'base64').toString());
const DRIVE_ENDPOINT = 'https://www.googleapis.com/auth/drive';
const SCOPES = [DRIVE_ENDPOINT];
const auth = new googleapis_1.google.auth.JWT(CREDENTIALS_JSON.client_email, null, CREDENTIALS_JSON.private_key, SCOPES);
const drive = googleapis_1.google.drive({ version: 'v3', auth });
let filename = target.split('/').pop();
async function bootstrap() {
    if (fs.lstatSync(target).isDirectory()) {
        filename = `${name || target}.zip`;
        CreateZipFromFolder(target, filename)
            .then(() => uploadToDrive())
            .catch(e => {
            actions.error('ZIPING FAILED');
            actions.error('ZIPING FAILED');
            throw e;
        });
    }
    else
        uploadToDrive();
}
function uploadToDrive() {
    actions.info('UPLOADING FILE......');
    drive.files.create({
        requestBody: {
            name: filename,
            parents: [folder]
        },
        media: {
            body: fs.createReadStream(`${name || target}${fs.lstatSync(target).isDirectory() ? '.zip' : ''}`)
        }
    }).then((res) => {
        const driveLink = `https://drive.google.com/open?id=${res.data.id}`;
        actions.setOutput(link, driveLink);
        return actions.info(` -> FILE SUCCESSFULLY UPLOADED`);
    })
        .catch(e => {
        actions.error('UPLOAD FAILED');
        throw e;
    });
}
function CreateZipFromFolder(source, out) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(out);
    return new Promise((resolve, reject) => {
        archive
            .directory(source, false)
            .on('error', (err) => reject(err))
            .pipe(stream);
        stream.on('close', () => {
            actions.info(`FOLDER SUCCESSFULLY ZIPED`);
            return resolve();
        });
        archive.finalize();
    });
}
bootstrap().catch(e => actions.setFailed(e));
//# sourceMappingURL=main.js.map