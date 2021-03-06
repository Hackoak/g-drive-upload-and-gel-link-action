const actions = require('@actions/core');
const { google } = require('googleapis');
const fs = require('fs');
const archiver = require('archiver');

/** Google Service Account credentials  encoded in base64 */
const credentials = actions.getInput('credentials', { required: true });

/** Google Drive Folder ID to upload the file/folder to */
const folder = actions.getInput('folder', { required: true });

/** Local path to the file/folder to upload */
const target = actions.getInput('target', { required: true });

/** Optional name for the zipped file */
const name = actions.getInput('name', { required: false });

/** Link to the Drive folder */
const link = 'link';

const CREDENTIALS_JSON = JSON.parse(Buffer.from(credentials, 'base64').toString());
const DRIVE_ENDPOINT = 'https://www.googleapis.com/auth/drive'
const SCOPES = [DRIVE_ENDPOINT];
const auth = new google.auth.JWT(CREDENTIALS_JSON.client_email, null, CREDENTIALS_JSON.private_key, SCOPES);
const drive = google.drive({ version: 'v3', auth });

let filename = target.split('/').pop();


async function main() {

  if (fs.lstatSync(target).isDirectory()) {
    filename = `${name || target}.zip`

    actions.info(`Folder detected in ${target}`)
    actions.info(`Zipping ${target}...`)

    zipDirectory(target, filename)
      .then(() => uploadToDrive())
      .catch(e => {
        actions.error('Zip failed');
        throw e;
      });
  }
  else
    uploadToDrive();
}

/**
 * Zips a directory and stores it in memory
 * @param {string} source File or folder to be zipped
 * @param {string} out Name of the resulting zipped file
 */
function zipDirectory(source, out) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on('error', err => reject(err))
      .pipe(stream);

    stream.on('close',
      () => {
        actions.info(`Folder successfully zipped: ${archive.pointer()} total bytes written`);
        return resolve();
      });
    archive.finalize();
  });
}

/**
 * Uploads the file to Google Drive
 */
function uploadToDrive() {
  actions.info('Uploading file to Goole Drive...');
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

    return actions.info(`File uploaded successfully -> ${res.data.id}`);
  })
    .catch(e => {
      actions.error('Upload failed');
      throw e;
    });
}

main().catch(e => actions.setFailed(e));

