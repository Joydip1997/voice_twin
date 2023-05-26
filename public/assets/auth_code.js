const provider = new firebase.auth.GoogleAuthProvider();
var slider = document.querySelector('.slider');
var coinToPurchase = document.getElementById('coin-to-purchase');
var generateAudio = document.getElementById('generate-audio');
var navButtonPricing = document.getElementById('pricing');

function toggleMenu() {
    var hamburger = document.querySelector('.hamburger');
    hamburger.classList.toggle('open');
}




slider.addEventListener('input', function () {
    var coins = slider.value / 1000
    var price = (slider.value * 0.00056).toFixed(2)
    coinToPurchase.textContent = 'Buy ' + coins + 'K Coins $' + price;
});


var ui1 = document.getElementById("generate");
var ui2 = document.getElementById("purchase-coins");
var testId = document.getElementById("test-id");
var googleSignInBtn = document.getElementById('google-sign-in-btn');

var menuItem1 = document.getElementById("generate-audio");
var menuItem2 = document.getElementById("buy-coins");
var menuItem3 = document.getElementById("login");

// Add click event listeners to menu items
menuItem1.addEventListener("click", function () {
    ui1.style.display = "block"; // Enable UI 1
    ui2.style.display = "none"; // Disable UI 2
});

menuItem2.addEventListener("click", function () {
    ui1.style.display = "none"; // Disable UI 1
    ui2.style.display = "block"; // Enable UI 2
});

menuItem3.addEventListener("click", function () {
    signinWitthGoogle()
});

googleSignInBtn.addEventListener('click', function () {
    signinWitthGoogle()
});

generateAudio.addEventListener('click', function () {
    ui1.style.display = "block"; // Disable UI 1
    ui2.style.display = "none"; // Enable UI 2
});

navButtonPricing.addEventListener('click', function () {
    ui1.style.display = "none"; // Disable UI 1
    ui2.style.display = "block"; // Enable UI 2
});

function fetchUserDetails(userId) {
    // Define query parameters
    const params = new URLSearchParams();
    params.append('userId', userId);


    // Build the URL with query parameters
    const url = 'http://vocaltwin.cloud/getUserDetails?' + params.toString();

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
                window.location.href = 'http://vocaltwin.cloud/home';
            }else{
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
    const url = 'http://vocaltwin.cloud/register?' + params.toString();

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

