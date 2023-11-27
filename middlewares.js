const Logger = require('./logger')
module.exports = {
    tryCatchedRoute: (fn,errorMsg) => {
        return async function (req, res) {
            try {
                await fn(req,res)
            }catch (err) {
                if(!err.response) {
                    const msg = errorMsg || err.toString()
                    Logger.logError(err.stack)
                    return res.status(500).send(msg)
                }
                return res.status(err.response.status).send(err.response.data)
            }
        }
    },
};



