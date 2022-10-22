const express = require("express");
const multiparty = require('multiparty')
const bodyParser = require("body-parser");
const fse = require('fs-extra')
const path = require("path");
const fs = require("fs");


const app = express();

app.use(express.static(__dirname + '/public'))

bodyParser.urlencoded({extends: true})
app.use(bodyParser.json())


const UPLOAD_DIR = path.resolve(__dirname, 'public/upload')
app.post('/upload', (req, res) => {
    // 定义存储文件目录
    const form = new multiparty.Form({uploadDir: 'temp'})

    form.parse(req);
    form.on('file', async (name, chunk) => {
        console.log('file')
        let chunkDir = `${UPLOAD_DIR}/${chunk.originalFilename.split('.')[0]}`
        if (!fse.pathExistsSync(chunkDir)) {
            await fse.mkdirp(chunkDir);
        }
        const dPath = path.join(chunkDir, chunk.originalFilename.split('.')[1]);
        await fse.move(chunk.path, dPath, {overwrite: true})
        res.send('文件分片上传成功')
    })

})
app.post('/merge', async (req, res) => {
    var name = req.body.name;
    var fname = name.split('.')[0];
    const chunkDir = path.join(UPLOAD_DIR, fname);
    const chunks = await fse.readdir(chunkDir);
    chunks.sort((a, b) => a - b).map(chunkPath => {
        fs.appendFileSync(
            path.join(UPLOAD_DIR, name),
            fs.readFileSync(`${chunkDir}/${chunkPath}`)
        )
    })
    fse.removeSync(chunkDir);
    res.send({
        msg: "合并成功",
        url: `http://localhost:3000/upload/${name}`
    })
})


app.listen(3000)
console.log('server: http://localhost:3000')
