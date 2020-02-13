/*eslint-env node*/
const CoreObject     = require('core-object');
const { Promise }    = require('rsvp');
const { URL }        = require('url');
const fs             = require('fs');
const snakeCaseKeys  = require('snakecase-keys');
const fetch          = require('node-fetch');
const path           = require('path');
const _              = require('lodash');


class Cloudinary extends CoreObject {
  constructor(plugin, uploadOptions) {
    super();

    this.cloudinary = require('cloudinary').v2;

    this.cloudName = plugin.readConfig('cloudName');

    let cloudinaryConfig = {
      cloud_name: this.cloudName, 
      api_key: plugin.readConfig('apiKey'), 
      api_secret: plugin.readConfig('apiSecret'),
    }

    const secure             = plugin.readConfig('secure'); // Force https
    const uploadPreset       = plugin.readConfig('uploadPreset');
    const cdnSubdomain       = plugin.readConfig('cdnSubdomain');

    /////  Relevant only for Advanced plan
    const privateCdn         = plugin.readConfig('privateCdn');
    const cname              = plugin.readConfig('cname');
    const secureDistribution = plugin.readConfig('secureDistribution');

    if (secure){
      plugin.log('Using secure flag (force https) from config ', { verbose: true });
      cloudinaryConfig.secure = secure;
    }

    if (uploadPreset){
      plugin.log('Using upload preset name from config ', { verbose: true });
      cloudinaryConfig.upload_preset = uploadPreset;
    }
    if (cdnSubdomain){
      plugin.log('Using cdn subdomains flag from config ', { verbose: true });
      cloudinaryConfig.cdn_subdomain = cdnSubdomain;
    }
    if (privateCdn){
      plugin.log('Using private cdn flag from config ', { verbose: true });
      cloudinaryConfig.private_cdn = privateCdn;
    }
    if (cname){
      plugin.log('Using cname from config ', { verbose: true });
      cloudinaryConfig.cname = cname;
    }
    if (secureDistribution){
      plugin.log('Using secure distribution from config ', { verbose: true });
      cloudinaryConfig.secure_distribution = secureDistribution;
    }

    this.cloudinaryConfig = cloudinaryConfig;
    this.plugin = plugin;

    this.cloudinary.config(cloudinaryConfig);

    this.uploadOptions = uploadOptions || {};

    // this.cloudinaryOptions = {
    //   proxy = plugin.readConfig('proxy');
    // }
  }

  async upload() {
    let manifestPath = this.uploadOptions.manifestPath;
   
    return await this.determineFilePaths
      .then( filePaths => {
        return this.putFiles(filePaths);
      })
      .then( allFilesUploaded => {
        if(manifestPath) {
          return this.putFile(manifestPath).then(manifestUploaded => {
            return allFilesUploaded.concat(manifestUploaded);
          });
        } else {
          return allFilesUploaded;
        }
      });
  }


  async putFiles(filePaths) {
    return Promise.all(
      filePaths.map(filePath => {
        return this.putFile(filePath/*, filePaths*/);
      })
    )
  }

  async putFile(filePath/*, filePaths*/) {
    let plugin      = this.plugin;
    let basePath    = path.join(this.uploadOptions.distDir, filePath);
    let folder      = this.uploadOptions.folder;

    // var isGzipped   = gzippedFilePaths.indexOf(filePath) !== -1;
    // var isBrotliCompressed = brotliCompressedFilePaths.indexOf(filePath) !== -1;


    let uploader = this.uploadOptions.uploadLarge ? this.cloudinary.uploader.upload_large : this.cloudinary.uploader.upload ;
 
    let params = snakeCaseKeys(this.uploadOptions);
    
    params['public_id'] = filePath
    
    plugin.log("** uploadOptions");
    plugin.log(JSON.stringify( params,  null, 1));

    return await uploader(basePath, params)
      .then(response => {
        plugin.log("");
        plugin.log("** File Upload");
        plugin.log('✔  ' + filePath, { verbose: true });
        plugin.log("* public_id for the uploaded file is :");
        plugin.log("* " + response.public_id);
        plugin.log("* URL for the uploaded file is :");
        plugin.log("* " + response.url);
        return filePath
      })
      .catch(err => {
        plugin.log("");
        plugin.log("** ERROR File Upload");
        if (err) { plugin.log(err); }
        return err
      });
  }

  get determineFilePaths() {
    let filePaths = this.uploadOptions.filePaths || [];
    if (typeof filePaths === 'string') {
      filePaths = [filePaths];
    }

    let folder       = this.uploadOptions.folder;
    let manifestPath = this.uploadOptions.manifestPath;

    if (manifestPath) {
      let key = folder === '' ? manifestPath : [folder, manifestPath].join('/');
      this.plugin.log('Downloading manifest for differential deploy from `' + key + '`...', { verbose: true });
      
      let path = [this.cloudName, 'files', key].join('/');
      let url = new URL(path, 'https://res.cloudinary.com/');
      
      return fetch(url)
        .then(res => res.text())
        .then(manifestEntries => {
          this.plugin.log("Manifest found. Differential deploy will be applied.", { verbose: true });
          return _.difference(filePaths, manifestEntries)
        })
        .catch(err => {
          this.plugin.log("Manifest not found. Disabling differential deploy.", { color: 'yellow', verbose: true });
          return filePaths;
        });
    } else {
      return filePaths;
    }
  }
}

module.exports = Cloudinary;
