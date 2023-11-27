
const axios = require("axios");

//http get for service-service communication with auth service
const privateGet = async function (route) {
    const {data} = await axios.get(route,
        {headers: {
                "authorization" : process.env.SERVICE_TOKEN
            }
        })
    return data
}



module.exports = {
    privateGet
};



