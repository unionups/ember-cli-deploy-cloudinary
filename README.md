
# ember-cli-deploy-cloudinary

> An ember-cli-deploy plugin. Upload assets to Cloudinary.

Compatibility
------------------------------------------------------------------------------

* Ember.js v3.8 or above
* Ember CLI v2.13 or above
* Node.js v8 or above

[![](https://ember-cli-deploy.github.io/ember-cli-deploy-version-badges/plugins/ember-cli-deploy-s3.svg)](http://ember-cli-deploy.github.io/ember-cli-deploy-version-badges/)

This plugin uploads one or more files to an Cloudynary CDN. It could be used to upload the assets (js, css, images etc) or indeed the application's index.html.

## What is an ember-cli-deploy plugin?

A plugin is an addon that can be executed as a part of the ember-cli-deploy pipeline. A plugin will implement one or more of the ember-cli-deploy's pipeline hooks.

For more information on what plugins are and how they work, please refer to the [Plugin Documentation][1].

## Quick Start

To get up and running quickly, do the following:

- Ensure [ember-cli-deploy-build][2] is installed and configured.

- Install this plugin

```bash
$ ember install ember-cli-deploy-cloudinary
```

- Place the following configuration into `config/deploy.js`

```javascript
ENV.cloudinary = {
    cloudName: '<your-cloudynary-cloud-name>'
    apiKey:    '<your-cloudynary-api-key>',
    apiSecret: '<your-cloudynary-api-secret>'
  }
```

- Run the pipeline

```bash
$ ember deploy
```

## Installation
Run the following command in your terminal:

```bash
ember install ember-cli-deploy-cloudinary
```

## ember-cli-deploy Hooks Implemented

For detailed information on what plugin hooks are and how they work, please refer to the [Plugin Documentation][1].

- `configure`
- `upload`

## Configuration Options

For detailed information on how configuration of plugins works, please refer to the [Plugin Documentation][1].

<hr/>

### cloudName

The Cloudinary Cloud name. [How to integrate Cloudinary][5]

### apiKey

The Cloudinary API Key. [How to integrate Cloudinary][5]

*Default:* `undefined`

### apiSecret

The Cloudinary API Secret. [How to integrate Cloudinary][5]

*Default:* `undefined`

### secure
Force HTTPS connection.

*Default:* `true`

### cdnSubdomain
Cloudynary subdomain. [Multiple sub-domains][7]

*Default:* `res`

### folder
Upload target folder.

*Default:* `''`

### timestampSubfolder
Upload to inserted timestamp subfolder of upload target. 
Possible subfolder types: 

- `timestamp`
- `md5` (a md5 hash from timestamp) 

*Default:* 

```javascript
  timestampSubfolder: {
      enabled: true,    
      type: "timestamp" // default, otherwise "md5" - hash from tymestamp
    }

```

### filePattern

Files that match this pattern will be uploaded to Cloudinary. The file pattern must be relative to `distDir`. For an advanced usage, you may want to check out [isaacs/minimatch](https://github.com/isaacs/minimatch#usage)'s documentation.

*Default:* `'**/*.{js,css,png,gif,ico,jpg,map,xml,txt,svg,swf,eot,ttf,woff,woff2,otf,wasm}'`

### fileIgnorePattern

Files matching this pattern will _not_ be uploaded even if they match filePattern.

*Default:* `null`

### dotFolders

This is a boolean that can be set to `true` to include hidden folders
(that are prefixed with a `.`) as folders that can be uploaded to Cloudinary.

*Default:* `false`


### invalidate
[Invalidating cached media assets on the CDN][8]

*Default:* `true`

### uploadLarge
Change SDK uploader if files larger than 100 MB

*Default:* `false`

### useFilename
See [Upload API reference][9]

*Default:* `true`

### uniqueFilename
See [Upload API reference][9]

*Default:* `true`

### overwrite
See [Upload API reference][9]

*Default:* `true`

### resourceType
Upload resource type. See [Upload API reference][9]

*Default:* `raw`

### type
See [Upload API reference][9]

*Default:* `upload`

### accessControl
See [Upload API reference][9]

*Default:* `{access_type: "anonymous"}`

### accessMode
See [Upload API reference][9]

*Default:*  `public`

### distDir

The root directory where the files matching `filePattern` will be searched for. By default, this option will use the `distDir` property of the deployment context, provided by [ember-cli-deploy-build][2].

*Default:* `context.distDir`

### distFiles

The list of built project files. This option should be relative to `distDir` and should include the files that match `filePattern`. By default, this option will use the `distFiles` property of the deployment context, provided by [ember-cli-deploy-build][2].

*Default:* `context.distFiles`

### manifestPath

The path to a manifest that specifies the list of files that are to be uploaded to CDN.

This manifest file will be used to work out which files don't exist on CDN and, therefore, which files should be uploaded. By default, this option will use the `manifestPath` property of the deployment context, provided by [ember-cli-deploy-manifest][4].

*Default:* `context.manifestPath`

## Additional features

This addon define `willBuild` hook and generate fingerprint for prepend assets. Generator based on the
`context.config.build.fingerprint.prepend` option and be available from 'context.cdnFingerprintPrepend' and `process.env.CDN_FINGERPRINT_PREPEND`. This useful, for example, for set build fingerprint in index.html assets paths. 

###Setup example code:

`config/deploy.js`

```javascript

  if (deployTarget === 'staging' || deployTarget === 'production') {
    let assets_prepend =  [ ENV.cloudinary.secure  ? "https:/" : "http:/",  
      ENV.cloudinary.cdnSubdomain  ? (ENV.cloudinary.cdnSubdomain + ".cloudinary.com") : "res.cloudinary.com",
      ENV.cloudinary.cloudName,
      "raw/upload",
      ENV.cloudinary.folder === "" ? "" : ENV.cloudinary.folder +"/" 
      
    ].join("/")

    ENV.build.fingerprint = {
      prepend: assets_prepend
    }
  }

```

`ember-cli-build.js`

```javascript

  const EmberApp = require('ember-cli/lib/broccoli/ember-app');

  module.exports = function(defaults) {

    let app = new EmberApp(defaults, {
      fingerprint: {
        prepend: process.env.CDN_FINGERPRINT_PREPEND
      }
    });
    return app.toTree();
  };

```



## Prerequisites

The following properties are expected to be present on the deployment `context` object:

- `distDir`      (provided by [ember-cli-deploy-build][2])
- `distFiles`    (provided by [ember-cli-deploy-build][2])
- `manifestPath` (provided by [ember-cli-deploy-manifest][4])


## Tests

* `yarn test`

## Why `ember build` and `ember test` don't work

Since this is a node-only ember-cli addon, this package does not include many files and dependencies which are part of ember-cli's typical `ember build` and `ember test` processes.

[1]: http://ember-cli-deploy.com/plugins/ "Plugin Documentation"
[2]: https://github.com/ember-cli-deploy/ember-cli-deploy-build "ember-cli-deploy-build"
[4]: https://github.com/ember-cli-deploy/ember-cli-deploy-manifest "ember-cli-deploy-manifest"
[5]: https://cloudinary.com/documentation/how_to_integrate_cloudinary "How to integrate Cloudinary"
[6]: https://cloudinary.com/documentation/advanced_url_delivery_options "Advanced URL delivery options"
[7]: https://cloudinary.com/documentation/advanced_url_delivery_options#multiple_sub_domains "Multiple sub-domains"
[8]: https://cloudinary.com/documentation/upload_images#invalidating_cached_media_assets_on_the_cdn "Invalidating cached media assets on the CDN"
[9]: https://cloudinary.com/documentation/image_upload_api_reference "Upload API reference"
