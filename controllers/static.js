const { Static, Sequelize } = require('../sequelize')
const Op = Sequelize.Op;
const Fn = Sequelize.fn;
const sharp = require('sharp');
const multer = require('multer');
const path = require('path')
var fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const { TYPES } = require('../models/static.model')

function createStorage(dir) {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            cb(null, uuidv4() + path.extname(file.originalname));
        }
    });
    return storage
}

let filePath = '/assets/files/';
let imagePath = '/assets/images/originals/';
let imageThumbnailPath = '/assets/images/thumbnails/';
const imageStorage = createStorage('assets/images/originals')
const fileStorage = createStorage('assets/files')

const imageFileFilter = (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
        cb(null, true);
    } else {
        console.log("mime type not accepted: " + file.mimetype)
        cb(null, false);
    }
}
const uploadImage = multer({ storage: imageStorage, fileFilter: imageFileFilter });

const uploadFile = multer({ storage: fileStorage });



const Self = {

    middlewareFiles: function () {
        return uploadFile.single('file')
    },

    uploadFile: async function (req, res, next) {

        const filename = req.file.filename
        const body = {
            file: filename,
            uploadedBy: req.user.id,
            type: TYPES.FILE
        }
        const data = await Static.create(body)

        res.status(200).json({ data })

    },

    middlewareImages: function () {
        return uploadImage.single('image')
    },

    uploadImage: async function (req, res, next) {

        const filename = req.file.filename
        const body = {
            file: filename,
            uploadedBy: req.user.id,
            type: TYPES.IMAGE
        }
        const data = await Static.create(body)
        const thumbPath = `assets/images/thumbnails/${filename}`

        await sharp(req.file.path).resize(250, 100).toFile(thumbPath)

        res.status(200).json({ data })
        //16:9 es aspect ratio comun: 200x356

    },

    deleteFile: async function (id) {
        console.log('fileid - ', id);
        const data = await Static.findOne({
            where: { id }
        })
        console.log('data - ', data.file);
        let path = __basedir + filePath + data.file;
        console.log('data - ', path);
        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
        }
        await Static.destroy({ where: { id } });
    },

    deleteImage: async function (id) {
        console.log('fileid - ', id);
        const data = await Static.findOne({
            where: { id }
        })
        console.log('data - ', data.file);
        let path = __basedir + imagePath + data.file;
        let thumbpath = __basedir + imageThumbnailPath + data.file;
        console.log('data - ', path);
        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
        }
        if (fs.existsSync(thumbpath)) {
            fs.unlinkSync(thumbpath);
        }
        await Static.destroy({ where: { id } });
    },

    index: async function (req, res) { },



    delete: async function (req, res) { },


}

module.exports = Self
