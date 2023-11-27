const PORT = process.env.PORT || 9005;
const express = require('express')
const http = require('http');
const https = require('https')
const app = express();
const fs = require('fs')
const resolvePath = require('path').resolve
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');

global.__basedir = __dirname + '/..'

const surveyController = require('./controllers/survey');
const productController = require('./controllers/product');
const authService = require('./services/auth');
const { tryCatchedRoute } = require("./middlewares");

const routes = require('./routes/index.route')

exports.start = function () {
    app.use(cors())
    app.use(morgan('dev'))
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    app.use('/static', express.static('assets'));
    app.use('/static', express.static('resources'));
    app.use(require('express').static(resolvePath(__dirname, '../www/dist')))
    
    //public routes
    app.get('/api/products', tryCatchedRoute(productController.index))
    app.post('/api/auth/login', tryCatchedRoute(authService.login))
    app.get('/api/auth/resetpassword/:email', tryCatchedRoute(authService.sendEmail))
    app.post('/api/auth/resetpassword', tryCatchedRoute(authService.resetpassword))

    //private routes
    app.use(authService.fetchUser)

    app.post('/api/getinitialstate', tryCatchedRoute(authService.getinitialstate))
    app.post('/api/getSnackbarState', tryCatchedRoute(authService.getSnackbarState))
    app.use('/api', routes)

    app.put('/api/worksession-survey/:id/response', tryCatchedRoute(surveyController.updateResponse))

    app.get('*', (req, res) => {
        const contents = fs.readFileSync(resolvePath(__dirname, '../www/dist/index.html'), 'utf8')
        res.send(contents)
    })

    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        app.listen(PORT, () => console.log(`Gennera Platform app listening on port ${PORT}`));
    } else {
        const httpsServer = https.createServer({
            key: fs.readFileSync('./src/cert/privkey.pem', 'utf8'),
            cert: fs.readFileSync('./src/cert/cert.pem', 'utf8'),
            ca: fs.readFileSync('./src/cert/chain.pem', 'utf8')
        }, app);

        httpsServer.listen(443, () => {
            console.log(`HTTPS Server running on port 443`);
        });

        http.createServer((req, res) => {
            res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
            res.end();
        }).listen(process.env.PORT || 8080, () => {
            console.log(`HTTP Server running on port 80`);
        });
    }
}



