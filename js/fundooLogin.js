document.addEventListener("DOMContentLoaded",function(){

    let loginForm = document.getElementById("fundoo-login-form");

    loginForm.addEventListener("submit",function(event){
        event.preventDefault();

        const email = document.getElementById("floatingInput").value;
        const password = document.getElementById("floatingPassword").value;

        if (!email || !password) {
            alert("Please enter both email and password.");
            return;
        }

        fetch("http://localhost:3000/api/v1/users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"  
            },
            body: JSON.stringify({email,password})
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem("jwtToken",data.token);
                alert("Login successful!");
                window.location.href = "../pages/fundooDashboard.html";
            }
            else{
                alert("Login failed: " + (data.error || "Invalid credentials"));
            }
        })
        .catch(error => {
            console.error("Error:",error);
            alert("Something went wrong. Please try again.");
        });
    });
});