const { google } = require('googleapis');
const actions = require('@actions/core');
const fs = require('fs');
const archiver = require('archiver');

// Google Service Account credentials  encoded in base64
const credentials = actions.getInput('credentials', { required: true });

// Google Drive Folder ID to upload the file/folder to
const folder = actions.getInput('folder-id', { required: true });

// Local path to the file/folder to upload
const target = actions.getInput('upload-from', { required: true });

// Optional name for the zipped file
const name = actions.getInput('name', { required: false });


// Setting the core 
const CREDENTIALS_JSON = JSON.parse(Buffer.from(credentials, 'base64').toString());
const DRIVE_ENDPOINT = 'https://www.googleapis.com/auth/drive'
const SCOPES = [DRIVE_ENDPOINT];
const auth = new google.auth.JWT(CREDENTIALS_JSON.client_email, null, CREDENTIALS_JSON.private_key, SCOPES);
const drive = google.drive({ version: 'v3', auth });

let filename = target.split('/').pop();

async function runAction() {
  // actions.setOutput(link, driveLink);

  if (fs.lstatSync(target).isDirectory()) {
    filename = `${name || target}.zip`

    actions.info(`Folder detected in the given target - ${target}`)
    actions.info(`Zipping the target Items ${target}...`)

    zipDirectory(target, filename)
      .then(() => uploadToDrive())
      .catch(e => {
        actions.error('Zipping the folders Failed');
        throw e;
      });
  }
  else
    uploadToDrive().then((r) => {
      actions.info(`Sending the output...${r.id}`)
      actions.info(`viewing the output...${r}`)
      const OUTPUT_LINK = `https://drive.google.com/open?id=${r.id}`
      actions.setOutput(OUTPUT_LINK);
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
    actions.info(`File uploaded successfully -> ${res}`);
    return res
  })
    .catch(e => {
      actions.error('File upload failed');
      throw e;
    });
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



runAction().catch(e => actions.setFailed(e));
