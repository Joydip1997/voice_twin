const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const Razorpay = require('razorpay');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');

require('dotenv').config();

const OutOfCoinsError = require('./CustomErrors');


// Define storage configuration for multer
const storage = multer.memoryStorage();
const upload = multer({ dest: 'uploads/' });

var admin = require("firebase-admin");

const app = express();
app.set('view engine', 'ejs');
app.use(express.json());
app.use('/public', express.static('public'));

app.use(cors({
  origin: '*'
}));
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

app.post("/home", (req, res) => {
  res.render("home.ejs");
})

app.get("/upload", (req, res) => {
  res.render("uploadfile.ejs");
})


// Firebase DB Calls

app.post('/register', async (req, res) => {
  const userId = req.query.userId
  console.log(userId)
  try {
    const listOfPreMadeVoices = await getListOfPreMadeVoices()

    const newUser = await db.collection('users').doc(userId).set({
      userId: userId,
      voices: listOfPreMadeVoices,
      token: 500
    })

    res.status(201).json(newUser)

  } catch (error) {

    res.status(400).json(error)
  }
})

app.get('/getUserDetails', (req, res) => {
  const userId = req.query.userId
  db.collection('users').doc(userId).get()
    .then(doc => {
      if (doc.exists) {

        const token = doc.data().token;
        const voices = doc.data().voices
        res.status(200).json({
          success: true,
          token: token,
          voices: voices
        });


      } else {
        res.status(404).json({
          success: false,
          token: 0
        })
      }
    }).catch((error) => {
      res.status(404).json({
        success: false,
        token: 0,
        error: error
      })
    });
})

app.post("/updateCoins", (req, res) => {
  let userId = req.query.userId
  let coinsUserPurchased = req.query.coinsUserPurchased
  incrementCoins(userId, coinsUserPurchased)
    .then(() => {
      res.render("home.ejs");
    })
    .catch((error) => {
      res.status(404).json(error)
    });
})

async function fetchAvailableToken(userId) {
  try {
    const doc = await db.collection('users').doc(userId).get();

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

// Eleven Api Calls
app.get('/convertTextToAudio', async (req, res) => {
  const userId = req.query.userId
  const paragraph = req.query.paragraph
  const selectedVoice = req.query.selectedVoice

  const token = await fetchAvailableToken(userId);

  if (paragraph.length > token) {
    res.status(400).json("buy tokens")
  }




  const fullURL = "https://api.elevenlabs.io/v1/text-to-speech/" + selectedVoice;

  const requestBody = JSON.stringify({
    text: paragraph,
    model_id: "eleven_multilingual_v1",
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
      decrementCoins(userId, decrementBy)
        .then(() => {
          res.status(200).send(apiRes.data);
        })
        .catch((error) => {
          res.status(404).json(error)
        });

    })
    .catch(error => {
  
      res.status(500).json(error);
    });
})


async function getListOfPreMadeVoices() {
  try {
    const response = await axios.get("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.API_KEY
      }
    });

    const extractedData = response.data;
    const listOfPreMadeVoices = extractedData.voices.map(({ voice_id, name, category }) => ({
      voice_id,
      name,
      category
    }));
    return listOfPreMadeVoices;
  } catch (error) {
    console.error('Error fetching list of pre-made voices:', error);
    return []; // Return an empty array or handle the error case as needed
  }
}




app.post('/clonevoice', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const userId = req.body.userId
    const fileName = req.body.name
    const filePath = file.path
    if (!file) {
      res.status(400).send('No file uploaded.');
      return;
    }

    if (!await hasSufficientCoins(userId)) {
      throw OutOfCoinsError()
    }

    const formData = new FormData();
    formData.append('name', fileName);
    formData.append('files', fs.createReadStream(filePath));

    const response = await axios.post('https://api.elevenlabs.io/v1/voices/add', formData, {
      headers: {
        'xi-api-key': process.env.API_KEY
      }
    });

    fs.unlink(filePath, (error) => {
      if (error) {
        console.error('Error deleting file:', error);
      } else {
        console.log('File deleted successfully');
      }
    });

    const newVoice = {
      voice_id: response.data.voice_id,
      name: fileName,
      category: "created"
    }

    const updatedData = await addNewVoiceIdAndUpdateCoins(userId, newVoice)


    res.status(201).json({
      voice_id : response.data.voice_id
    })


  } catch (error) {
    res.status(400).send(error)
  }
});


// Utils
async function hasSufficientCoins(userId) {
  const documentRef = db.collection("users").doc(userId);
  const documentSnapshot = await documentRef.get();

  if (!documentSnapshot.exists) {
    console.log('Document does not exist.');
    return;
  }

  const token = documentSnapshot.data().token;

  return token > process.env.COIN_REQUIRED_FOR_VOICE_PURCHASE
}

async function addNewVoiceIdAndUpdateCoins(userId, newVoice) {
  const documentRef = db.collection("users").doc(userId);
  const documentSnapshot = await documentRef.get();

  if (!documentSnapshot.exists) {
    console.log('Document does not exist.');
    return;
  }

  const token = documentSnapshot.data().token;

  if (token < 500) {
    throw OutOfCoinsError()
  }

  //Update coins for the voice addition
  await db.runTransaction(async (transaction) => {

    if (documentSnapshot.exists) {
      const newCounter = token - process.env.COIN_REQUIRED_FOR_VOICE_PURCHASE;
      transaction.update(documentRef, { token: newCounter });
    } else {
      throw new Error('User document does not exist.');
    }
  });

  const list = documentSnapshot.data().voices || [];
  const voices = list || [];



  voices.push(newVoice);

  await documentRef.update({ voices });
}


function decrementCoins(userId, decrementBy) {
  const userRef = db.collection('users').doc(userId);

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

function incrementCoins(userId, incrementBy) {
  const userRef = db.collection('users').doc(userId);

  return db.runTransaction((transaction) => {
    return transaction.get(userRef)
      .then((doc) => {
        if (doc.exists) {
          const currentCounter = doc.data().token;
          const newCounter = parseInt(currentCounter) + parseInt(incrementBy);
          transaction.update(userRef, { token: newCounter });
        } else {
          throw new Error('User document does not exist.');
        }
      });
  });
}


// Razorpay Paymnt SDK

app.post("/purchase", async (req, res) => {
  let coinsUserWantToPurchase = req.body.coinsUserWantToPurchase

  let costPerCoin = process.env.ONE_COIN_PRICE
  let totalCost = coinsUserWantToPurchase * costPerCoin

  var instance = new Razorpay({ key_id: 'rzp_test_RYO9l0r3IOg3Ia', key_secret: 'nx7RdpgXtbjCpK1N4nF73LSC' })

  try {
    let order = await instance.orders.create({
      amount: totalCost * 100,
      currency: "INR",
      receipt: "receipt#1",
      notes: {
        key1: "value3",
        key2: "value2"
      }
    })

    res.status(201).json({
      "success": true,
      "order": order
    })
  } catch (error) {

    res.status(404).json({
      "success": false,
      "error": error
    })
  }

})

app.post('/payment-verification', (req, res) => {
  const payment = req.body;
  // Extract payment details from the payload
  const payment_id = payment.payload.payment.entity.id;
  const userId = payment.payload.payment.entity.notes.userId;
  const coinsUserWantToPurchase = payment.payload.payment.entity.notes.coinsUserWantToPurchase;


  incrementCoins(userId, coinsUserWantToPurchase)
    .then(() => {
      res.render("home.ejs");
    })
    .catch((error) => {
      res.status(404).json(error)
    });
});


app.listen(process.env.PORT || 7000, () => {
  console.log("Server is running ");
});
