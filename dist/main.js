"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const googleapis_1 = require("googleapis");
const fs_1 = require("fs");
const archiver_1 = require("archiver");
const credentials = core_1.default.getInput('credentials', { required: true });
const folder = core_1.default.getInput('folder', { required: true });
const target = core_1.default.getInput('upload', { required: true });
const name = core_1.default.getInput('name', { required: false });
const link = 'link';
const CREDENTIALS_JSON = JSON.parse(Buffer.from(credentials, 'base64').toString());
const DRIVE_ENDPOINT = 'https://www.googleapis.com/auth/drive';
const SCOPES = [DRIVE_ENDPOINT];
const auth = new googleapis_1.google.auth.JWT(CREDENTIALS_JSON.client_email, null, CREDENTIALS_JSON.private_key, SCOPES);
const drive = googleapis_1.google.drive({ version: 'v3', auth });
let filename = target.split('/').pop();
async function bootstrap() {
    if (fs_1.default.lstatSync(target).isDirectory()) {
        filename = `${name || target}.zip`;
        CreateZipFromFolder(target, filename)
            .then(() => uploadToDrive())
            .catch(e => {
            core_1.default.error('ZIPING FAILED');
            throw e;
        });
    }
    else
        uploadToDrive();
}
function uploadToDrive() {
    core_1.default.info('UPLOADING FILE......');
    drive.files.create({
        requestBody: {
            name: filename,
            parents: [folder]
        },
        media: {
            body: fs_1.default.createReadStream(`${name || target}${fs_1.default.lstatSync(target).isDirectory() ? '.zip' : ''}`)
        }
    }).then((res) => {
        const driveLink = `https://drive.google.com/open?id=${res.data.id}`;
        core_1.default.setOutput(link, driveLink);
        return core_1.default.info(` -> FILE SUCCESSFULLY UPLOADED`);
    })
        .catch(e => {
        core_1.default.error('UPLOAD FAILED');
        throw e;
    });
}
function CreateZipFromFolder(source, out) {
    const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
    const stream = fs_1.default.createWriteStream(out);
    return new Promise((resolve, reject) => {
        archive
            .directory(source, false)
            .on('error', (err) => reject(err))
            .pipe(stream);
        stream.on('close', () => {
            core_1.default.info(`FOLDER SUCCESSFULLY ZIPED`);
            return resolve();
        });
        archive.finalize();
    });
}
bootstrap().catch(e => core_1.default.setFailed(e));
//# sourceMappingURL=main.js.map