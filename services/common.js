import axios from "axios";


//http get for service-service communication with auth service
export async function privateGet(route) {
    const {data} = await axios.get(route,
        {headers: {
                "authorization" : process.env.SERVICE_TOKEN
            }
        })
    return data
}

