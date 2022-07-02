import * as actions from '@actions/core';
import { google } from 'googleapis';
import fs from 'fs';
import archiver from 'archiver';

// Google Service Account credentials  encoded in base64
const credentials = actions.getInput('credentials', { required: true });

// Google Drive Folder ID to upload the file/folder to
const folder = actions.getInput('folder', { required: true });

// Local path to the file/folder to upload
const target = actions.getInput('target', { required: true });

// Optional name for the zipped file
const name = actions.getInput('name', { required: false });

// Link to the Drive folder 
const link = 'link';

const CREDENTIALS_JSON = JSON.parse(Buffer.from(credentials, 'base64').toString());
const DRIVE_ENDPOINT = 'https://www.googleapis.com/auth/drive'
const SCOPES = [DRIVE_ENDPOINT];
const auth = new google.auth.JWT(CREDENTIALS_JSON.client_email, null, CREDENTIALS_JSON.private_key, SCOPES);
const drive = google.drive({ version: 'v3', auth });

let filename = target.split('/').pop();

async function bootstrap() {

  if (fs.lstatSync(target).isDirectory()) {
    filename = `${name || target}.zip`

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


/**
 * Uploads the file to Google Drive
 */
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
    const driveLink = `https://drive.google.com/open?id=${res.data.id}`
    actions.setOutput(link, driveLink);
    return actions.info(` -> FILE SUCCESSFULLY UPLOADED`);
  })
    .catch(e => {
      actions.error('UPLOAD FAILED');
      throw e;
    });
}


/**
 * Zips a directory and stores it in memory
 * ------------------------------------------
 * @param {string} source File or folder to be zipped
 * @param {string} out Name of the resulting zipped file
 */
function CreateZipFromFolder(source: string, out: fs.PathLike) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(out);

  return new Promise<void>((resolve, reject) => {
    archive
      .directory(source, false)
      .on('error', (err: any) => reject(err))
      .pipe(stream);

    stream.on('close',
      () => {
        actions.info(`FOLDER SUCCESSFULLY ZIPED`);
        return resolve();
      });
    archive.finalize();
  });
}

bootstrap().catch(e => actions.setFailed(e));
