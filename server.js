const express = require('express');

const app = express();

const bcrypt = require('bcryptjs');

const cors = require('cors');

const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
     connectionString : process.env.DATABASE_URL,
     ssl: {
    rejectUnauthorized: false
  }
  }
})



app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors())


app.get('/', (req, res)=>{
	res.send("it is working");
})



app.post('/signin', (req, res)=>{

const {email, password } = req.body

  if(!email || !password){
   return res.status(400).json('incorrect form submission')
  }
  
// load user
   db.select('email', 'hash').from('login')
      .where('email', '=', email)
      .then(data => {
         const isValid = bcrypt.compareSync(password, data[0].hash);
         if (isValid){
            db.select('*').from('users')
              .where('email', '=', email)
              .then(user =>{
                  res.json(user[0])
              })
              .catch(err => res.status(400).json('unable to get user'))

          }else{
                res.status(400).json('wrong credentials')
          }            
          })
        .catch(err => res.status(400).json('wrong credentials'))
})



app.post('/loadprojects', (req, res)=>{
//load user projects
    db.select('*').from('projects')
              .where('email', '=', req.body.email)
              .orderBy('id', 'desc')
              .returning('*')
              .then(user => {
                  res.json(user)
                })
              .catch(err => res.status(400).json('error loading projects'))

})


app.post('/register', (req, res)=>{
//regiter new user
  const { email, name, password } = req.body;

  if(!email|| !name || !password){
   return res.status(400).json('incorrect form submission')
  }
  
  const salt = bcrypt.genSaltSync(10);
 
  const hash = bcrypt.hashSync(password, salt);

 /*bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(password, salt, function(err, hash) {
              // Store hash in your password DB.
              		console.log(hash);
          });*/
  db.transaction(trx =>{
          trx.insert({
            hash: hash,
            email:email
          })
          .into('login')
          .returning('email')
          .then(loginEmail => {
            return trx('users')
              .returning('*')
              .insert({
                email: loginEmail[0],
                name: name,
                joined: new Date()
              })
              .then(user =>{
                res.json(user[0]);
              })
          })
          .then(trx.commit)
          .catch(trx.rollback)
      })

      .catch(err => res.status(400).json('unable to register'))

     }) 



app.put('/updatedone', (req,res)=>{
//update DONE field
  const { id, key, assetPercentage, assetCompleted } = req.body;
   db.select('*').from('projects')
          .where('id', '=', req.body.id)
          .returning(['assetpercentage', 'assetcompleted'])
          .update({
              assetpercentage: assetPercentage,
              assetcompleted: assetCompleted,
              key:key
            })

          .then(user => {
                  console.log(user[0]);

                   res.json(user[0])
                })
})


app.put('/updateneeded', (req,res)=>{
//update needed field
  const { id, key, assetPercentage, assetCurrent } = req.body;
   db.select('*').from('projects')
          .where('id', '=', req.body.id)
          .returning(['assetpercentage', 'assetcurrent'])
          .update({
              assetpercentage: assetPercentage,
              assetcurrent: assetCurrent,
              key:key
            })

          .then(user => {
                  res.json(user[0])
                })
})


app.put('/updatedate', (req,res)=>{
//update date field
  const { id, key, date, percentage, percentStart, updatedDate } = req.body;
   
    db.select('*').from('projects')
          .where('id', '=', req.body.id)
          .returning('*')
          .update({
              updateddate: date,
              percentage: percentage,
             // key:key
            })

          .then(user => {
                 res.json(user)
                })
})



app.post('/addproject', (req,res)=>{
//add new project 
   const { assetInitial, assetCurrent, key, projectName, email,
             date, percentage, assetPercentage, assetCompleted,
             startDate, updatedDate, formatStartTime, percentStart
             } = req.body;

    
   db.select('*').from('projects')
              .insert({
                projectname:projectName,
                email:email,
                assetinitial: assetInitial,
                assetcurrent: assetCurrent,
                date: date,
                /*  percentage: percentage,
                assetpercentage: assetPercentage,
                assetcompleted: assetCompleted,
                startdate: startDate,
                updateddate: updatedDate,
                formatstarttime: formatStartTime,
                percentstart: percentStart     */ 
              })
              .where('email', '=', req.body.email)
             // .returning('*')

              .then(user => {

                  res.json(user)
                })
              .catch(err => res.status(400).json('error adding projects'))

})


app.delete('/delete', (req, res)=>{
//delete project
   db.select('*').from('projects')
         .where('id','=', req.body.id)
         .del()
         .then(user => {
              db.select('*').from('projects')
              .where('email', '=', req.body.email)
              .orderBy('id', 'desc')
              .returning('*')
              .then(projects =>{
                console.log(projects)
                  res.json(projects)
              })
              .catch(err => res.status(400).json('unable to get projects'))
                })
          .catch(err => res.status(400).json('error deleting projects'))

})


app.listen(process.env.PORT || 3000, ()=>{
	console.log(`app is running on port ${process.env.PORT}`)
})

