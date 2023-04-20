import axios from "axios"

const API_URL = 'http://localhost:8080'

const obtenerProductos = async () => {
    return await axios.get(`${API_URL}/apiProductos`)
        .then(response => {
            return response
        })
        .catch(error => {
            console.error(error)
        })
}

const agregarProducto = async (producto) => {
    return await axios.post(`${API_URL}/apiProductos`, producto)
        .then(response => {
            return response
        })
        .catch(error => {
            console.error(error)
        })  
}

const actualizarProducto = async (id, producto) => {
    return await axios.put(`${API_URL}/apiProductos/${id}`, producto)
        .then(response => {
            return response
        })
        .catch(error => {
            console.error(error)
        })
}

const eliminarProducto = async (id) => {
    return await axios.delete(`${API_URL}/apiProductos/${id}`)
        .then(response => {
            return response
        })
        .catch(error => {
            console.error(error)
        })
}

export {
    obtenerProductos,
    agregarProducto,
    actualizarProducto,
    eliminarProducto
}
