const express = require('express');
const axios = require('axios');
const Razorpay = require('razorpay');
const cors = require('cors');

require('dotenv').config();


var admin = require("firebase-admin");

const app = express();
app.set('view engine', 'ejs');
app.use(express.json());
app.use('/public', express.static('public'));

// app.use(cors({
//   origin: 'http://www.vocaltwin.cloud'
// }));

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
  const userId = req.query.userId
  db.collection('users').doc(userId).set({
    userId: userId,
    token: 500
  })
    .then((docRef) => {
      res.status(201).json({ success: true })
    })
    .catch((error) => {
      res.status(404).json({ success: true, error: error })
    });
})

app.get('/getUserDetails', (req, res) => {
  const userId = req.query.userId
  db.collection('users').doc(userId).get()
    .then(doc => {
      if (doc.exists) {

        const token = doc.data().token;
        res.status(200).json({
          success: true,
          token: token
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

app.get('/convertTextToAudio', async (req, res) => {
  const userId = req.query.userId
  const paragraph = req.query.paragraph
  const selectedVoice = req.query.selectedVoice

  const token = await fetchAvailableToken(userId);

  if (paragraph.length > token) {
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
      decrementCoins(userId, decrementBy)
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


app.get("/test", (req, res) => {
  res.status(200).json(123)
})

app.post("/purchase", async (req, res) => {
  let coinsUserWantToPurchase = req.body.coinsUserWantToPurchase

  let costPerCoin = 0.042
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

app.post('/payment-verification', (req, res) => {
  const payment = req.body;
  // Extract payment details from the payload
  const payment_id = payment.payload.payment.entity.id;
  const userId = payment.payload.payment.entity.notes.userId;
  const coinsUserWantToPurchase = payment.payload.payment.entity.notes.coinsUserWantToPurchase;


  console.log('User ID:', userId);
  console.log('Custom Field:', coinsUserWantToPurchase);

  // Call your API endpoint to update Firebase data
  // ...
  res.json(done)
});


app.listen(process.env.PORT || 7000, () => {
  console.log("Server is running ");
});
