# A github action for uploading files and folders to google drive
This is a **GitHub action** to upload a file or a folder (zipped) to **Google Drive** using a Google Service Account.

## Table of Contents
- [Changes](#changes)
- [Setup](#setup)
    - [Store credentials as GitHub secrets](#Store-credentials-as-GitHub-secrets)
- [Inputs](#inputs)
    - [`credentials`](#credentials)
    - [`folder-id`](#folder-id)
    - [`folder-id`](#folder-id)
    - [`name`](#name)
- [Outputs](#outputs)




## Setup
This section lists the requirements to make this action work and how to meet them.


### Store credentials as GitHub secrets
Convert the credentials.json as a string with this command.
```bash
$ base64 credentials.json > creds_base64_string.txt
```

## Inputs
This section lists all inputs this action can take.

### `credentials`
Required: **YES**  
A base64 encoded string with your GSA credentials.

### `folder-id`
Required: **YES**  
Google Drive folder ID to upload the file/folder.  
>I would suggest you store this as an environmental variable or a Github secret


### `upload-from`
Required: **YES**  
Local path to the file/folder to upload.
>If the path to a folder is given, it will be zipped before upload.

### `name`
Required: **NO**  
Default: `null`  
The name you want your zip file to have.
>- If the `upload-from` input is a file, this input will be ignored.  
>- If not provided, it will default to the folder's name.

## Outputs

A link to the Drive file.

### Workflow example
This is a workflow example  that upload a file or folder as a zip file to a Drive folder.

```yaml

# Upload to Drive
- name: Upload public folder to Google Drive
uses: Hackoak/g-drive-upload-and-gel-link-action@master
id: driveUpload
with:
# use file.txt for upload a file or user the path/tofolder to upload a folder  
    upload-from: path/to/file.txt
    credentials: <YOUR_DRIVE_CREDENTIALS>
    folder: <YOUR_DRIVE_FOLDER_ID>

# Play with the output drive link
- name: Play with the output drive link
  run: echo ${{ steps.driveUpload.outputs.link }}
```

