const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 5000;


// Configuración de CORS para permitir solicitudes desde tu frontend
app.use(cors({
    origin: 'https://gedeones-arauco.vercel.app', // Reemplaza con la URL de tu frontend
}));


app.use(bodyParser.json());
// Configuración de Sequelize para PostgreSQL usando tus credenciales
const sequelize = new Sequelize('tesoreria', 'miusuario', '1234', {
    host: 'localhost', // Cambia a la URL de tu servidor PostgreSQL si no es local
    dialect: 'postgres',
    port: 5432, // Puerto por defecto de PostgreSQL, ajusta si es diferente
    dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? { // Usar SSL en producción si es necesario
            require: true,
            rejectUnauthorized: false // Puede ser necesario si usas un certificado autofirmado
        } : false,
    },
    logging: false, // Deshabilitar el logging de Sequelize, cambiar a true para depuración
});

// Verificar la conexión a la base de datos
sequelize.authenticate()
    .then(() => console.log('Conexión a la base de datos exitosa.'))
    .catch(err => console.error('No se pudo conectar a la base de datos:', err));

// Definir modelos de datos usando Sequelize
const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

const Pago = sequelize.define('Pago', {
    mes: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fondoBernabe: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    fondoEscritura: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    obraPersonal: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
});

// Sincronizar modelos con la base de datos
sequelize.sync()
    .then(() => console.log('Tablas sincronizadas con la base de datos'))
    .catch((error) => console.error('Error al sincronizar con la base de datos:', error));

// Rutas de la API

// Ruta de registro
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashedPassword });
        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Ruta de inicio de sesión
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username } });
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ id: user.id }, 'secretkey', { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Credenciales incorrectas' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Ruta para guardar un pago
app.post('/api/pagos', async (req, res) => {
    const { mes, nombre, fondoBernabe, fondoEscritura, obraPersonal, total } = req.body;
    try {
        const pago = await Pago.create({ mes, nombre, fondoBernabe, fondoEscritura, obraPersonal, total });
        res.status(201).json(pago);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Ruta para obtener todos los pagos
app.get('/api/pagos', async (req, res) => {
    try {
        const pagos = await Pago.findAll();
        res.json(pagos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Ruta para eliminar un pago
app.delete('/api/pagos', async (req, res) => {
    const { mes, nombre } = req.body;
    try {
        await Pago.destroy({ where: { mes, nombre } });
        res.status(200).json({ message: 'Pago eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Iniciar el servidor
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
