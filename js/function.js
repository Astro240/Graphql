async function login() {
    const email = document.getElementById('textInput').value; //get the input email/username
    const password = document.getElementById('passInput').value; //get the input password
    const errorDiv = document.getElementById('error'); //get the placeholder for the error

    try {
        const response = await fetch('https://learn.reboot01.com/api/auth/signin', {
            method: 'POST', //fetch wiuth post method
            headers: {
                'Authorization': 'Basic ' + btoa(email + ':' + password), //insert header for authorization with the basic type and base 64 encription
                'Content-Type': 'application/json'
            }
        });
        //if the credentials are wrong
        if (!response.ok) {
            throw new Error('Invalid credentials'); //throw invalid credentials for the catch block to handle it
        }

        const data = await response.json();//get the jwt token from the response
        localStorage.setItem('jwt', data); //insert into the local storage
        window.location.href = 'profile.html'; // Redirect to profile page
    } catch (error) {
        errorDiv.textContent = error.message; //show error message to user
    }
}
