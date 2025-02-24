document.addEventListener("DOMContentLoaded", function () {
    document.querySelector(".signup-form").addEventListener("submit", async function (event) {
        event.preventDefault();

        let name = document.getElementById("name").value.trim();  // Changed to match backend
        let phone_number = document.getElementById("phone_number").value.trim(); // Changed to match backend
        let email = document.getElementById("email").value.trim();
        let password = document.getElementById("password").value.trim();
        let confirm_password = document.getElementById("confirm_password").value.trim();

        if (password !== confirm_password) {
            alert("Passwords do not match!");
            return;
        }

        let requestData = {
            name: name, 
            phone_number: phone_number, 
            email: email, 
            password: password
        };

        try {
            let response = await fetch("http://localhost:3000/api/v1/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData)
            });

            let result = await response.json();

            if (response.ok) {
                alert("Registration successful!");
                window.location.href = "../pages/fundooLogin.html"; // Redirect to login page
            } else {
                alert("Error: " + result.errors.join(", "));
            }
        } catch (error) {
            alert("Network error, please try again.");
        }
    });
});
