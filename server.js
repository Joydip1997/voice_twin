const express = require('express');
const axios = require('axios');
require('dotenv').config();


var admin = require("firebase-admin");

const app = express();
app.set('view engine', 'ejs');
app.use(express.json());
app.use('/public', express.static('public'));

var serviceAccount = require("./vocal-twin-firebase-adminsdk-4n3o0-c9eb8325f0.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});






const db = admin.firestore();


app.get('', (req, res) => {
  // Render the 'index.ejs' file
  res.render("auth.ejs");
});



app.get('/auth', (req, res) => {
  // Render the 'index.ejs' file
  res.render("auth.ejs");
});

app.get('/home', (req, res) => {
  // Render the 'index.ejs' file
  res.render("home.ejs");
});

app.post('/register', (req, res) => {
  const uid = req.query.uid
  db.collection('users').doc(uid).set({
    uid: uid,
    token: 500
  })
    .then((docRef) => {
      console.log('Document written with ID: ', docRef.id);
    })
    .catch((error) => {
      console.error('Error adding document: ', error);
    });
})

app.get('/getUserDetails', (req, res) => {
  const uid = req.query.uid
  db.collection('users').doc(uid).get()
    .then(doc => {
      if (doc.exists) {

        const token = doc.data().token;
        res.status(200).json(token);


      } else {
        res.status(404).json('No such document!')
      }
    });
})

app.get('/convertTextToAudio', async(req, res) => {
  const uid = req.query.uid
  console.log(uid)
  const paragraph = req.query.paragraph
  const selectedVoice = req.query.selectedVoice

  const token = await fetchAvailableToken(uid);

  if(paragraph.length > token){
    res.status(404).json("buy tokens")
  }




  const fullURL = "https://api.elevenlabs.io/v1/text-to-speech/" + selectedVoice;

  const requestBody = JSON.stringify({
    text: paragraph,
    model_id: "eleven_monolingual_v1",
    voice_settings: {
      stability: 0,
      similarity_boost: 0
    }
  });

  res.set({
    'Content-Type': 'audio/mpeg',
    'Content-Disposition': 'attachment; filename="audio.mp3"'
  });

  axios.post(fullURL, requestBody, {
    responseType: 'arraybuffer',
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": process.env.API_KEY
    }
  })
    .then(apiRes => {
      const decrementBy = paragraph.length; 
      decrementCounter(uid, decrementBy)
        .then(() => {
          res.status(200).send(apiRes.data);
        })
        .catch((error) => {
          res.status(404).json(error)
        });
      
    })
    .catch(error => {
      // Handle any errors that occurred during the API call
      console.error(error);
      res.status(500).send(error);
    });
})

function decrementCounter(uid, decrementBy) {
  console.log(uid)
  console.log(decrementBy)
  const userRef = db.collection('users').doc(uid);

  return db.runTransaction((transaction) => {
    return transaction.get(userRef)
      .then((doc) => {
        if (doc.exists) {
          const currentCounter = doc.data().token;
          const newCounter = currentCounter - decrementBy;
          transaction.update(userRef, { token: newCounter });
        } else {
          throw new Error('User document does not exist.');
        }
      });
  });
}

async function fetchAvailableToken(uid){
  try {
    const doc = await db.collection('users').doc(uid).get();

    if (doc.exists) {
      const token = doc.data().token;
      return parseInt(token);
    } else {
      return 0
    }
  } catch (error) {
    return 0
  }
}






app.listen(3000, (req, res) => {

})
