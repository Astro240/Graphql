async function login() {
    const email = document.getElementById('textInput').value; //get the input email/username
    const password = document.getElementById('passInput').value; //get the input password
    const errorDiv = document.getElementById('error'); //get the placeholder for the error

    try {
        const response = await fetch('https://learn.reboot01.com/api/auth/signin', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(email + ':' + password),
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        const data = await response.json();
        localStorage.setItem('jwt', data);
        window.location.href = 'profile.html'; // Redirect to profile page
    } catch (error) {
        errorDiv.textContent = error.message;
    }
}