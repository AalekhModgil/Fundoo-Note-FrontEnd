document.addEventListener("DOMContentLoaded", function() {
    // Login Form Submission
    let loginForm = document.getElementById("fundoo-login-form");
    loginForm.addEventListener("submit", function(event) {
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
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem("jwtToken", data.token);
                localStorage.setItem("userEmail", data.user.email);
                localStorage.setItem("userName", data.user.name);
                alert("Login successful!");
                window.location.href = "../pages/fundooDashboard.html";
            } else {
                alert("Login failed: " + (data.error || "Invalid credentials"));
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Something went wrong. Please try again.");
        });
    });

    // Forgot Password Form Submission
    let forgotPasswordForm = document.getElementById("forgot-password-form");
    forgotPasswordForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const email = document.getElementById("forgotEmail").value;

        if (!email) {
            alert("Please enter your email.");
            return;
        }

        fetch("http://localhost:3000/api/v1/users/forget", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Forgot password request failed with status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.message && data.otp && data.user_id) {
                alert(data.message); // "OTP has been sent to your email"
                localStorage.setItem("resetEmail", email);
                localStorage.setItem("resetUserId", data.user_id); // Store user_idk
                const forgotModal = bootstrap.Modal.getInstance(document.getElementById("forgotPasswordModal"));
                forgotModal.hide();
                const resetModal = new bootstrap.Modal(document.getElementById("resetPasswordModal"));
                resetModal.show();
            } else {
                alert("Error: " + (data.errors || "Email not registered"));
            }
        })
        .catch(error => {
            console.error("Error:", error.message);
            alert(`Failed to send OTP: ${error.message}`);
        });
    });

    // Reset Password Form Submission
    let resetPasswordForm = document.getElementById("reset-password-form");
    resetPasswordForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const otp = document.getElementById("resetOtp").value;
        const newPassword = document.getElementById("newPassword").value;
        const userId = localStorage.getItem("resetUserId");

        if (!otp || !newPassword) {
            alert("Please enter both OTP and new password.");
            return;
        }

        if (!userId) {
            alert("User ID not found. Please request OTP again.");
            return;
        }

        fetch(`http://localhost:3000/api/v1/users/reset/${userId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ otp, new_password: newPassword })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Reset password request failed with status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.message === "Password successfully reset") {
                alert("Password reset successful! Please log in with your new password.");
                const resetModal = bootstrap.Modal.getInstance(document.getElementById("resetPasswordModal"));
                resetModal.hide();
                localStorage.removeItem("resetEmail");
                localStorage.removeItem("resetUserId");
            } else {
                alert("Error: " + (data.message || "Invalid OTP or request"));
            }
        })
        .catch(error => {
            console.error("Error:", error.message);
            alert(`Reset password failed: ${error.message}`);
        });
    });
});