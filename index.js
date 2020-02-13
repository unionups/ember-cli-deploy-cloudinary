'use strict';

const RSVP             = require('rsvp');
const minimatch        = require('minimatch');
const crypto           = require('crypto');
const DeployPluginBase = require('ember-cli-deploy-plugin');
const Cloudinary       = require('./lib/cloudinary');

function md5Hash(buf) {
  let md5 = crypto.createHash('md5');
  md5.update(buf);
  return md5.digest('hex');
}

module.exports = {
  name: require('./package').name,

   createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,
      defaultConfig: {
        filePattern: '**/*.{js,css,png,gif,ico,jpg,map,xml,txt,svg,swf,eot,ttf,woff,woff2,otf,wasm}',
        fileIgnorePattern: null,
        folder: '',
        timestampSubfolder: {
          enabled: true,
          type: "timestamp" // default, otherwise ("hash")  md5 hash from tymestamp
        },
        secure: true,
        invalidate: true,
        dotFolders: false,
        uploadLarge: false, // files that are larger than 100 MB
        useFilename: true,
        uniqueFilename: true,
        overwrite: true,
        resourceType: 'raw',
        type: 'upload',
        accessControl: {access_type: "anonymous"},
        accessMode: 'public',


        distDir: function(context) {
          return context.distDir;
        },
        distFiles: function(context) {
          return context.distFiles || [];
        },
        // gzippedFiles: function(context) {
        //   return context.gzippedFiles || []; // e.g. from ember-cli-deploy-gzip
        // },
        // brotliCompressedFiles: function(context) {
        //   return context.brotliCompressedFiles || []; // e.g. from ember-cli-deploy-gzip
        // },
        manifestPath: function(context) {
          return context.manifestPath; // e.g. from ember-cli-deploy-manifest
        }
      },
      requiredConfig: ['cloudName', 'apiKey', 'apiSecret'],
      willBuild: function(context) {
        if (!context.config.build.fingerprint) {
          context.config.build.fingerprint = {}
        }
        if (context.config.cloudinary.timestampSubfolder.enabled && context.config.build.fingerprint.prepend) {
          if(context.config.cloudinary.timestampSubfolder.type === "md5") {
            var timestampSubfolder = context.config.timestampSubfolder = md5Hash(new Date().toISOString());
          } else {

            var timestampSubfolder = context.config.timestampSubfolder = new Date().toISOString();             
          }
          
          context.cdnFingerprintPrepend =  process.env.CDN_FINGERPRINT_PREPEND = context.config.build.fingerprint.prepend + timestampSubfolder + "/";
          context.config.cloudinary.folder = context.config.cloudinary.folder === "" ? timestampSubfolder : ("/" + timestampSubfolder);
        } else if (context.config.build.fingerprint.prepend) {
          context.cdnFingerprintPrepend = process.env.CDN_FINGERPRINT_PREPEND = context.config.build.fingerprint.prepend
        } else {
          context.cdnFingerprintPrepend = process.env.CDN_FINGERPRINT_PREPEND = ""
        }
      } ,
      upload: function(context) {
        let filePattern           = this.readConfig('filePattern');
        let fileIgnorePattern     = this.readConfig('fileIgnorePattern');
        let distFiles             = this.readConfig('distFiles');
        let cloudName             = this.readConfig('cloudName');
        let dotFolders            = this.readConfig('dotFolders');

        let filesToUpload = distFiles.filter(minimatch.filter(filePattern, { matchBase: true, dot: dotFolders }));
        
        if (fileIgnorePattern) {
          filesToUpload = filesToUpload.filter(function(path) {
            return !minimatch(path, fileIgnorePattern, { matchBase: true });
          });
          // gzippedFiles = gzippedFiles.filter(function(path) {
          //   return !minimatch(path, fileIgnorePattern, { matchBase: true });
          // });
          // brotliCompressedFiles = brotliCompressedFiles.filter(function(path) {
          //   return !minimatch(path, fileIgnorePattern, { matchBase: true });
          // });
        }

        let uploadOptions = {
          filePaths: filesToUpload,
          // gzippedFilePaths: gzippedFiles,
          // brotliCompressedFilePaths: brotliCompressedFiles,
          distDir:        this.readConfig('distDir'),
          invalidate:     this.readConfig('invalidate'),
          uploadLarge:    this.readConfig('uploadLarge'),
          useFilename:    this.readConfig('useFilename'),
          uniqueFilename: this.readConfig('uniqueFilename'),
          overwrite:      this.readConfig('overwrite'),
          resourceType:   this.readConfig('resourceType'),
          type:           this.readConfig('type'),
          accessControl:  this.readConfig('accessControl'),
          accessMode:     this.readConfig('accessMode'),
          manifestPath:   this.readConfig('manifestPath'),
          secure:         this.readConfig('secure'),
          folder:         this.readConfig('folder') 
        };

        this.log('Preparing to upload to Cloudinary `' + cloudName + '`', { verbose: true });

        let cloudinary = new Cloudinary(this, uploadOptions)
        
        return cloudinary.upload()
          .then(filesUploaded => {
            this.log('uploaded ' + filesUploaded.length + ' files ok', { verbose: true });
            return { filesUploaded: filesUploaded };
          })
          .catch(this._errorMessage.bind(this));
      },
      _errorMessage: function(error) {
        this.log(error, { color: 'red' });
        if (error) {
          this.log(error.stack, { color: 'red' });
        }
        return RSVP.reject(error);
      }
    });
    return new DeployPlugin();
  }
};
