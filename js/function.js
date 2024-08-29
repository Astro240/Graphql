async function login() {
    var usernameOrEmail = document.getElementById('textInput').value;
    var password = document.getElementById('passInput').value;
    const url = 'https://learn.reboot01.com/api/auth/signin';
    const credentials = `${usernameOrEmail}:${password}`;
    const encodedCredentials = btoa(credentials); // Base64 encode

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${encodedCredentials}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log(data.token); // Handle the token (e.g., save it)
        } else {
            console.error('Login failed:', response.statusText);
        }
    } catch (error) {
        console.error('Error during login:', error);
    }
}