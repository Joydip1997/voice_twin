
var currentTokenCount = 100
var currentUserId = ""


var logout = document.getElementById("logout");
var sumbitBtn = document.getElementById("submitButton");

var navButtonGenerateAudio = document.getElementById("nav_button_generate");
var navButtonCoinCounterText = document.getElementById("nav_button_coin_counter_text");


var generateAudioUi = document.getElementById("generate-audio-ui");
var textCounter = document.getElementById("text_counter");
var buyCoinsUi = document.getElementById("purchase-coins");
var slider = document.querySelector('.slider');
var coinToPurchase = document.getElementById('coin-to-purchase');

navButtonGenerateAudio.addEventListener('click', function () {
    generateAudioUi.style.display = "block"; 
    buyCoinsUi.style.display = "none";
});

navButtonCoinCounterText.addEventListener('click', function () {
    buyCoinsUi.style.display = "block";
    generateAudioUi.style.display = "none";
});

slider.addEventListener('input', function () {
    var coins = slider.value / 1000
    var price = (slider.value * 0.00056).toFixed(2)
    coinToPurchase.textContent = 'Buy ' + coins + 'K Coins $' + price;
});

function toggleMenu() {
    var hamburger = document.querySelector('.hamburger');
    hamburger.classList.toggle('open');
}



function fetchUserDetails(uid) {
    currentUserId = uid
    const params = new URLSearchParams();
    params.append('uid', uid);


    sumbitBtn.disabled = true;
    const url = 'http://localhost:3000/getUserDetails?' + params.toString();


    const requestOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
    };

    // Make the fetch request with query parameters
    fetch(url, requestOptions)
        .then(response => response.json())
        .then(data => {
            // Handle the response data
            console.log(data);
            currentTokenCount = parseInt(data)
            textCounter.textContent = "Characters remaining: " + currentTokenCount;
            navButtonCoinCounterText.textContent = "💰 Coins " + currentTokenCount
        })
        .catch(error => {
            // Handle any errors
            console.error(error);
        })
        .finally(() => {
            sumbitBtn.disabled = false;
        });

}

// xxxxxxxxxx Working For Sign Out xxxxxxxxxx
function signOut() {
    firebase.auth().signOut().then(function () {
        // Sign-out successful.
        setTimeout(function () {
            document.body.innerHTML = '';
            document.head.innerHTML = '';

            // Navigate to another page
            window.location.href = 'http://localhost:3000/auth';
        }, 1000)
    }).catch(function (error) {
        // An error happened.
        let errorMessage = error.message;

    });
}






//UI Code
logout.addEventListener("click", function () {
    signOut()
})


document.getElementById("voiceForm").addEventListener("input", function (event) {

    var paragraph = document.getElementById("paragraph").value;
    var selectedVoice = document.getElementById("voices").value;


    var remainingCharacters = currentTokenCount - paragraph.length;

    textCounter.innerHTML = (remainingCharacters > 0) ? "Characters remaining: " + remainingCharacters : "<span style='color: red;'>You are out of characters</span>";

    if (paragraph.length > 0 && remainingCharacters > 0 && selectedVoice !== "") {
        sumbitBtn.disabled = false;
    } else {
        sumbitBtn.disabled = true;
    }
});

const voicesSelect = document.getElementById("voices");

window.onload = function () {
    // Fetch the list of voices from the API
    fetch("https://api.elevenlabs.io/v1/voices", {
        headers: {
            "Content-Type": "application/json",
            "xi-api-key": "046b09bfa501c8aab5bb53af9d0f6511"
        }
    })
        .then(response => response.json())
        .then(data => {
            // Get the select element


            // Loop through the voice data and create options for the select element
            data.voices.forEach(voice => {
                // Create an option element
                const option = document.createElement("option");

                // Set the option's text and value attributes
                option.text = voice.name;
                option.value = voice.voice_id;

                // Append the option to the select element
                voicesSelect.appendChild(option);
            });
        })
        .catch(error => {
            // Handle any errors
            console.error("Error:", error);
            const option = document.createElement("option");
            option.text = error;
            option.value = voice.modelId;

            // Append the option to the select element
            voicesSelect.appendChild(option);
        });
};

document.getElementById("voiceForm").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent form submission

    // Retrieve form values
    var paragraph = document.getElementById("paragraph").value;
    var selectedVoice = document.getElementById("voices").value;


    // Retrieving data from localStorage
    const storedData = localStorage.getItem('uid');
    let userId


    if (storedData) {
        userId = storedData;
    } else {
        console.log('No data found in localStorage.');
    }



    // Show loading state
    var loadingText = document.createElement("div");
    loadingText.textContent = "Loading...";
    sumbitBtn.disabled = true;
    document.getElementById("voiceForm").appendChild(loadingText);

    const apiUrl = 'http://localhost:3000/convertTextToAudio';

    // Query parameters
    const queryParams = {
        selectedVoice: selectedVoice,
        paragraph: paragraph,
        uid: userId
    };

    // Construct the query string
    const queryString = Object.keys(queryParams)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
        .join('&');

    // Construct the complete URL with query string
    const urlWithParams = `${apiUrl}?${queryString}`;

    // Example code for API call using fetch
    fetch(urlWithParams, {
        method: "GET",

    })
        .then(response => response.blob())
        .then(blob => {
            // Create a URL for the audio blob
            const audioUrl = URL.createObjectURL(blob);

            // Create an audio element
            const audioElement = document.createElement("audio");

            // Set the source of the audio element
            audioElement.src = audioUrl;
            audioElement.controls = true; // Add controls to the audio element

            // Append the audio element to the DOM
            document.getElementById("audioContainer").appendChild(audioElement);
            const existingAudioElement = audioContainer.querySelector("audio");
            if (existingAudioElement) {
                audioContainer.replaceChild(audioElement, existingAudioElement);
            } else {
                audioContainer.appendChild(audioElement);
            }
        })
        .catch(error => {
            console.error("Error:", error);
        })
        .finally(() => {
            loadingText.remove();
            sumbitBtn.disabled = false;
        });
});

