const express = require('express');
const cors = require('cors');
const mongodb = require('mongodb')
const mongoclient = mongodb.MongoClient;
const dotenv = require("dotenv").config()
const URL = process.env.DB
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const JWT_SC = process.env.secret_key
const app = express();

const products = []

app.use(cors({
    origin: "http://localhost:3001"
}))

app.use(express.json())

const authorize = (req, res, next) => {
    try {
        if (req.headers.authorization) {
            const tokenverify = jwt.verify(req.headers.authorization, JWT_SC)
            if (tokenverify) {
                next()
            } else {
                res.status(401).json({ message: "Token expired" })
            }}
        else {
            res.status(401).json({ message: "Token not found" })
        }
    } 
    catch (error) {
    res.status(401).json({ message: "Unauthorized" })
}}



app.post("/user/register", async (req, res) => {
    try {
        const connection = await mongoclient.connect(URL);
        const db = connection.db("B39WDT2");
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(req.body.password, salt)
        req.body.password = hash
        const user = await db.collection("users").insertOne(req.body)
        await connection.close()
        res.json({ message: "user created" })
    } catch (error) {
        console.log(error)
    }
})

app.post("/user/login", async (req, res) => {
    try {
        const connection = await mongoclient.connect(URL);
        const db = await connection.db("B39WDT2")
        const user = await db.collection("users").findOne({ email: req.body.email })
        if (user) {
            const passwordcheck = await bcrypt.compare(req.body.password, user.password)
            if (passwordcheck) {
                const token = jwt.sign({ _id: user._id }, JWT_SC, { expiresIn: "2m" })
                res.json({ message: "Success", token })
            } else {
                res.json({ message: "Incorrect email/password" })
            }
        } else {
            res.status(404).json({ message: "Incorrect email/password" })
        }
    } catch (error) {
        console.log(error)
    }
})

app.post("/product", authorize, async (req, res) => {
    // req.body.id = products.length+1
    // products.push(req.body)
    // res.json({message: "product added"})

    try {
        const connection = await mongoclient.connect(URL);
        const db = connection.db("B39WDT2");
        const product = await db.collection("products").insertOne(req.body)
        await connection.close()
        res.json({ message: "product added", id: product.insertedId })
    } catch (error) {
        console.log(error)
    }

})

app.put("/product/:productid", authorize, async (req, res) => {
    // let productid = req.params.productid
    // let productindex = products.findIndex((prod) => prod.id == productid)
    // let keys = Object.keys(req.body)
    // keys.forEach((key) => {
    //     products[productindex][key] = req.body[key]
    // })
    // res.json({ message: "updated" })
    try {
        const connection = await mongoclient.connect(URL);
        const db = connection.db("B39WDT2");
        delete req.body._id
        const product = await db.collection("products").updateOne({ _id: mongodb.ObjectId(req.params.productid) }, { $set: req.body })
        await connection.close()
        res.json({ message: "product updated" })
    } catch (error) {
        console.log(error)
    }
})

app.get("/products", authorize, async (req, res) => {
    // res.json(products)
    try {
        const connection = await mongoclient.connect(URL);
        const db = connection.db("B39WDT2");
        const product = await db.collection("products").find().toArray()
        await connection.close()
        res.json(product)
    } catch (error) {
        console.log(error)
    }
})

app.get("/product/:productid", authorize, async (req, res) => {
    // let productid = req.params.productid
    // let productindex = products.findIndex((prod) => prod.id == productid)
    // res.json(products[productindex])
    try {
        const connection = await mongoclient.connect(URL);
        const db = connection.db("B39WDT2");
        const product = await db.collection("products").findOne({ _id: mongodb.ObjectId(req.params.productid) })
        await connection.close()
        res.json(product)
    } catch (error) {
        console.log(error)
    }

})

app.delete("/product/:productid", authorize, async (req, res) => {
    // let productid = req.params.productid
    // let productindex = products.findIndex((prod) => prod.id == productid)
    // products.splice(productindex, 1)
    // res.json({ message: "product deleted" })

    try {
        const connection = await mongoclient.connect(URL);
        const db = connection.db("B39WDT2");
        const product = await db.collection("products").deleteOne({ _id: mongodb.ObjectId(req.params.productid) })
        await connection.close()
        res.json({ message: "product deleted" })
    } catch (error) {
        console.log(error)
    }
})

app.listen(3000)