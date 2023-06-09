const jwt = require('jsonwebtoken');
const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
require("dotenv").config()



// middleware

app.use(express.json())
app.use(cors())

// verifying jwt token
const verifyJWT = (req,res,next)=>{
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true, message:"unauthorized access"})
  }
  // bearer token
  const token = authorization.split(" ")[1]

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,decoded)=>{
    if(err){
      return res.status(401).send({error: true, message: "unauthorized access"})
    }
    req.decoded = decoded
    next();
  })
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-hzckllx-shard-00-00.wvig2d6.mongodb.net:27017,ac-hzckllx-shard-00-01.wvig2d6.mongodb.net:27017,ac-hzckllx-shard-00-02.wvig2d6.mongodb.net:27017/?ssl=true&replicaSet=atlas-sxh7jl-shard-0&authSource=admin&retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    const menuCollection = client.db("bistroBoss").collection("menuCollection")
    const reviewsCollection =client.db("bistroBoss").collection("reviewsCollection")    
    const cartCollection =client.db("bistroBoss").collection("cartCollection")    
    const usersCollection =client.db("bistroBoss").collection("usersCollection")    
    
    // jwt
    app.post("/jwt", (req,res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'1hr'})
      res.send({token}) 
    })






    // user api
    // writing frist time sign upd users name and email in the database
    app.post('/users', async(req,res)=>{
      const user = req.body;
      const query = {email:user.email}
      const existingUser = await usersCollection.findOne(query);
      if(!existingUser){
        const result = await usersCollection.insertOne(user)
        res.send(result)
        return
      }
      return res.send({message:"user already exists"})
    })
    

    // getting all saved users from database 
    app.get("/users", async(req,res)=>{
      const result = await usersCollection.find().toArray()
      res.send(result)
    })

    // update users role
    app.patch("/users/admin/:id", async(req,res)=>{
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: new ObjectId(id)};
      const updateDoc = {
        $set : {
          role:"admin"
        },
      }
      const result = await usersCollection.updateOne(filter,updateDoc);
      res.send(result);
    })
    // menu api
    app.get("/menu", async(req,res)=>{
        const result = await menuCollection.find().toArray()
        res.send(result)
    })
    // reviews api
    app.get("/reviews", async(req,res)=>{
        const result = await reviewsCollection.find().toArray()
        res.send(result)
    })
    // cart collection 
    app.post("/carts", async(req,res)=>{
      const item = req.body;
      const result = await cartCollection.insertOne(item)
      res.send(result)
    })
    app.get("/carts", verifyJWT, async(req,res)=>{
      const decodedEmail = req.decoded.email 
      const email = req.query.email;
      // this if is checking the user is not getting any others information by their email. its checking email in the token and email in the query of api call. if both matched this will return data. else it will give 403
      if(email !== decodedEmail){
        return res.status(403).send({error: true, message: "forbidden access"})
      }
      
      if(!email){
        res.send([])
      }
      const query = {email: email};
      const result = await cartCollection.find(query).toArray()
      res.send(result)

    })
    app.delete("/carts/:id", async(req,res)=>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await cartCollection.deleteOne(query);
      res.send(result)
    })





    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);











app.get("/", (req,res)=>{
    res.send("bistro boss server is running")
})

app.listen(port, ()=>{
    console.log("Bistro Boss is running on", port);
})