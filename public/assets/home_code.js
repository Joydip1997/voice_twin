
var currentTokenCount = 0
var coinsUserWantToPurchase = 100
var currentUserId = ""


var logout = document.getElementById("logout");
var sumbitBtn = document.getElementById("submitButton");

var navButtonGenerateAudio = document.getElementById("nav_button_generate");
var navButtonCoinCounterText = document.getElementById("nav_button_coin_counter_text");
var navButtonCreateNewAudio = document.getElementById("nav_button_create_new_audio");

var generateAudioUi = document.getElementById("generate-audio-ui");
var buyCoinsUi = document.getElementById("purchase-coins");
var createAudioCloneUi = document.getElementById("create_audio_clone_ui");
var textCounter = document.getElementById("text_counter");

var slider = document.querySelector('.slider');
var coinToPurchase = document.getElementById('coin-to-purchase');

var voiceForm = document.getElementById("voiceForm")
var voicesSelect = document.getElementById("voices");

const audioContainer = document.getElementById("audioContainer");




navButtonGenerateAudio.addEventListener('click', function () {
    generateAudioUi.style.display = "block";
    buyCoinsUi.style.display = "none";
    createAudioCloneUi.style.display = "none";
});

navButtonCoinCounterText.addEventListener('click', function () {
    buyCoinsUi.style.display = "block";
    generateAudioUi.style.display = "none";
    createAudioCloneUi.style.display = "none";
});

navButtonCreateNewAudio.addEventListener('click', function () {
    createAudioCloneUi.style.display = "block";
    generateAudioUi.style.display = "none";
    buyCoinsUi.style.display = "none";
});

slider.addEventListener('input', function () {
    coinsUserWantToPurchase = slider.value
    var coins = slider.value / 100
    var price = (slider.value * 0.042).toFixed(2)
    coinToPurchase.textContent = 'Buy ' + coins + 'K Coins $' + price;
});

function toggleMenu() {
    var hamburger = document.querySelector('.hamburger');
    hamburger.classList.toggle('open');
}


// xxxxxxxxxx Fetch User Details xxxxxxxxxx
function fetchUserDetails(userId) {
    currentUserId = userId
    const params = new URLSearchParams();
    params.append('userId', userId);


    sumbitBtn.disabled = true;
    const url = "http://vocaltwin.cloud" + '/getUserDetails?' + params.toString();


    const requestOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
    };

    fetch(url, requestOptions)
        .then(response => response.json())
        .then(data => {
            if (data.success == true) {
                let token = data.token
                currentTokenCount = parseInt(token)
                textCounter.textContent = "Characters remaining: " + currentTokenCount;
                navButtonCoinCounterText.textContent = "💰 Coins " + currentTokenCount
                data.voices.forEach(voice => {
                    const option = document.createElement("option");
                    option.text = voice.name + " (" +voice.category+ ")";
                    option.value = voice.voice_id;
                    voicesSelect.appendChild(option);
                })
            }
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
            navigateToAuth()
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


voiceForm.addEventListener("input", function (event) {

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




voiceForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent form submission
    var paragraph = document.getElementById("paragraph").value;
    var selectedVoice = document.getElementById("voices").value;
    const storedData = localStorage.getItem('userId');
    let userId
    userId = storedData;
    var loadingText = document.createElement("div");
    loadingText.textContent = "Loading...";
    sumbitBtn.disabled = true;
    document.getElementById("voiceForm").appendChild(loadingText);

    const apiUrl = 'http://vocaltwin.cloud/convertTextToAudio';


    const queryParams = {
        selectedVoice: selectedVoice,
        paragraph: paragraph,
        userId: userId
    };


    const queryString = Object.keys(queryParams)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
        .join('&');


    const urlWithParams = `${apiUrl}?${queryString}`;
    audioContainer.innerHTML = ""; // Clear any existing content


    fetch(urlWithParams, {
        method: "GET",

    })
        .then(response => response.blob())
        .then(blob => {
            // Create a URL for the audio blob
            const audioUrl = URL.createObjectURL(blob);




            const audioElement = document.createElement("audio");
            audioElement.src = audioUrl;
            audioElement.controls = true; // Add controls to the audio element


            audioContainer.appendChild(audioElement);


            // Update Coins After Each Transaction

            currentTokenCount -= parseInt(paragraph.length)
            textCounter.textContent = "Characters remaining: " + currentTokenCount;
            navButtonCoinCounterText.textContent = "💰 Coins " + currentTokenCount

            var remainingCharacters = currentTokenCount;
            textCounter.innerHTML = (remainingCharacters > 0) ? "Characters remaining: " + remainingCharacters : "<span style='color: red;'>You are out of characters</span>";

            if (paragraph.length > 0 && remainingCharacters > 0 && selectedVoice !== "") {
                sumbitBtn.disabled = false;
            } else {
                sumbitBtn.disabled = true;
            }
        })
        .catch(error => {
            alert("Out Of Coins")
        })
        .finally(() => {
            loadingText.remove();
            sumbitBtn.disabled = false;
        });
});

coinToPurchase.onclick = function (e) {
    fetch('http://vocaltwin.cloud/purchase', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coinsUserWantToPurchase }),
    })
        .then(response => response.json())
        .then(data => {
            var options = {
                "key": "rzp_test_RYO9l0r3IOg3Ia", // Enter the Key ID generated from the Dashboard
                "amount": data.order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
                "currency": "INR",
                "name": "Voice Twin", //your business name
                "description": coinsUserWantToPurchase + " Coins",
                "image": "https://example.com/your_logo",
                "callback_url": "http://vocaltwin.cloud/home",
                "order_id": data.order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
                "notes": {
                    "userId": currentUserId,
                    "coinsUserWantToPurchase": coinsUserWantToPurchase
                },
                "theme": {
                    "color": "#3399cc"
                }
            };
            var rzp1 = new Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                alert(response.error.code);
                alert(response.error.description);
                alert(response.error.source);
                alert(response.error.step);
                alert(response.error.reason);
                alert(response.error.metadata.order_id);
                alert(response.error.metadata.payment_id);
            });
            rzp1.open();
            e.preventDefault();
        })
        .catch(error => {
            alert(error);
        });
}



// Utils
function navigateToAuth() {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    window.location.href = 'http://vocaltwin.cloud/auth';
}




//Generate Audio Clone Section

const filesInput = document.getElementById('files');
const fileList = document.querySelector('.file-list');
const submitBtn = document.getElementById('submitBtn');


filesInput.addEventListener('change', handleFileSelect);
fileList.addEventListener('click', handleFileRemove);
submitBtn.addEventListener('click', handleUpload);
let file

function handleFileSelect(e) {
    fileList.innerHTML = '';

    const files = e.target.files;
    file = files[0];

    alert(files.length);
}


function handleFileRemove(e) {
    if (e.target.tagName === 'BUTTON') {
        const index = e.target.getAttribute('data-index');
        const fileItem = e.target.parentNode;
        fileList.removeChild(fileItem);
        filesInput.value = '';
    }
}

function handleUpload() {
    const name = "TEST";

    if (name.trim() === '') {
        alert('Please enter a name for the audio.');
        return;
    }

    if (files.length === 0) {
        alert('Please select at least one file.');
        return;
    }

    if (files.length > 3) {
        alert('You can only upload up to 3 files.');
        return;
    }

    // Perform file upload logic here
    // You can use the File API or FormData to upload the files to a server or Firebase Storage

    // Clear the form after successful upload
    filesInput.value = '';
    fileList.innerHTML = '';
    // document.getElementById('name').value = '';

    var formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);
    formData.append('userId', currentUserId);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://vocaltwin.cloud/clonevoice', true);
    //xhr.setRequestHeader('xi-api-key', '046b09bfa501c8aab5bb53af9d0f6511');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && s === 200) {
            alert('Files uploaded successfully!');

        }
        console.log(xhr.status);
    };
    xhr.send(formData);


}

