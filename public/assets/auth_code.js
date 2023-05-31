const BASE_URL = "https://www.vocaltwin.cloud/"

const provider = new firebase.auth.GoogleAuthProvider();
var slider = document.querySelector('.slider');
var coinToPurchase = document.getElementById('coin-to-purchase');
var generateAudio = document.getElementById('generate-audio');
var navButtonPricing = document.getElementById('pricing');
var navButtonPrivacyPolicy = document.getElementById("nav_button_privacy_policy");
var navButtonContactUs = document.getElementById("nav_button_contact_us");

function toggleMenu() {
    var hamburger = document.querySelector('.hamburger');
    hamburger.classList.toggle('open');
}




slider.addEventListener('input', function () {
    var coins = slider.value / 1000
    var price = (slider.value * 0.00056).toFixed(2)
    coinToPurchase.textContent = 'Buy ' + coins + 'K Coins $' + price;
});


var generateAudioUi = document.getElementById("generate");
var purchaseCoinsUi = document.getElementById("purchase-coins");
var contactUsPage = document.getElementById('contact_us');
var privacyPolicyPage = document.getElementById('privacy_policy');
var googleSignInBtn = document.getElementById('google-sign-in-btn');

var menuGenerateAudio = document.getElementById("generate-audio");
var menuPurchaseCoins = document.getElementById("buy-coins");
var menuLogin = document.getElementById("login");

// Add click event listeners to menu items
menuGenerateAudio.addEventListener("click", function () {
    generateAudioUi.style.display = "block"; 
    googleSignInBtn.style.display = "block"; 

    purchaseCoinsUi.style.display = "none"; 
    privacyPolicyPage.style.display = "none"; 
    contactUsPage.style.display = "none"; 
 
});

menuPurchaseCoins.addEventListener("click", function () {
    purchaseCoinsUi.style.display = "block"; 
    googleSignInBtn.style.display = "block"; 

    generateAudioUi.style.display = "none"; 
    privacyPolicyPage.style.display = "none"; 
    contactUsPage.style.display = "none"; 
});

menuLogin.addEventListener("click", function () {
    signinWitthGoogle()
});

googleSignInBtn.addEventListener('click', function () {
    signinWitthGoogle()
});



navButtonPricing.addEventListener('click', function () {
    purchaseCoinsUi.style.display = "block"; 
    generateAudioUi.style.display = "none";

    privacyPolicyPage.style.display = "none";
    contactUsPage.style.display = "none";
    googleSignInBtn.style.display = "block"; 
});

navButtonPrivacyPolicy.addEventListener("click", function () {
    privacyPolicyPage.style.display = "block";
  
    purchaseCoinsUi.style.display = "none"; 
    generateAudioUi.style.display = "none";
    contactUsPage.style.display = "none";
    googleSignInBtn.style.display = "none"; 
})

navButtonContactUs.addEventListener("click", function () {
    contactUsPage.style.display = "block";
  
    purchaseCoinsUi.style.display = "none"; 
    generateAudioUi.style.display = "none";
    privacyPolicyPage.style.display = "none";
    googleSignInBtn.style.display = "none"; 
})

function fetchUserDetails(userId) {
    // Define query parameters
    const params = new URLSearchParams();
    params.append('userId', userId);


    // Build the URL with query parameters
    const url = BASE_URL + 'getUserDetails?' + params.toString();

    // Prepare the request options
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
            if (data.success == true) {
                // Remove previous page's HTML and CSS
                document.body.innerHTML = '';
                document.head.innerHTML = '';

                // Navigate to another page
                window.location.href = BASE_URL + 'home';
            } else {
                registerNewUser(userId)
            }
        })
        .catch(error => {
            registerNewUser(userId)
        });

}

function registerNewUser(userId) {
    // Define query parameters
    const params = new URLSearchParams();
    params.append('userId', userId);


    // Build the URL with query parameters
    const url = BASE_URL + 'register?' + params.toString();

    // Prepare the request options
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
    };

    // Make the fetch request with query parameters
    fetch(url, requestOptions)
        .then(response => response.json())
        .then(data => {
            // Handle the response data
            console.log(data);
        })
        .catch(error => {
            // Handle any errors
            console.error(error);
        });

}

function signinWitthGoogle() {
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            // User signed in successfully
            const user = result.user;
            const userId = user.uid
            fetchUserDetails(userId)
        })
        .catch((error) => {
            // Handle sign-in errors
            console.error(error);
        });
}

