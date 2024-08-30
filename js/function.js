async function login() {
    const email = document.getElementById('textInput').value;
    const password = document.getElementById('passInput').value;
    const errorDiv = document.getElementById('error');
    const token = localStorage.getItem('jwt');

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