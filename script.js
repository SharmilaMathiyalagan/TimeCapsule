// script.js

// Function to load and display capsules
async function loadCapsules() {
    try {
        const res = await fetch("/api/capsules");
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const capsules = await res.json();

        const container = document.getElementById("capsuleList");
        container.innerHTML = ""; // clear old capsules to prevent duplicates

        // Get today's date at the beginning of the day for accurate comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

        if (capsules.length === 0) {
            container.innerHTML = "<p>No capsules created yet. Make one!</p>";
        } else {
            // Sort capsules so unlocked ones appear first, then by open date
            capsules.sort((a, b) => {
                const dateA = new Date(a.openDate);
                const dateB = new Date(b.openDate);
                const isAUnlocked = today >= dateA;
                const isBUnlocked = today >= dateB;

                if (isAUnlocked && !isBUnlocked) return -1; // A is unlocked, B is not, A comes first
                if (!isAUnlocked && isBUnlocked) return 1;  // B is unlocked, A is not, B comes first
                return dateA - dateB; // If both are same lock state, sort by date
            });

            capsules.forEach(capsule => {
                const div = document.createElement("div");

                // Convert the capsule's openDate string into a Date object
                // Ensure the date string is parsed correctly (e.g., 'YYYY-MM-DD')
                const openDate = new Date(capsule.openDate + "T00:00:00"); // Add T00:00:00 to ensure UTC comparison or local start of day

                let contentHTML = "";
                let classList = "capsule-card";

                if (today >= openDate) {
                    // It's time to open!
                    classList += " unlocked";
                    contentHTML = `
                        <h3>${capsule.title}</h3>
                        <p class="capsule-message">${capsule.message}</p>
                        <small>Opened on: ${openDate.toDateString()}</small>
                    `;
                } else {
                    // Still locked
                    classList += " locked";
                    contentHTML = `
                        <h3>${capsule.title}</h3>
                        <p class="capsule-message">This capsule is sealed.</p>
                        <small>Unlocks on: ${openDate.toDateString()}</small>
                    `;
                }

                div.className = classList;
                // Add the delete button to the card
                div.innerHTML = `
                    <button class="delete-btn" data-id="${capsule.id}" title="Delete Capsule">✖</button>
                    ${contentHTML}
                `;
                container.appendChild(div);
            });
        }
    } catch (error) {
        console.error("Failed to load capsules:", error);
        const container = document.getElementById("capsuleList");
        container.innerHTML = "<p>Could not load capsules. Please try again later.</p>";
    }
}

// Call when page loads
document.addEventListener("DOMContentLoaded", loadCapsules);

// Handle form submission
document.getElementById("capsuleForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');

    const title = document.getElementById("title").value.trim();
    const message = document.getElementById("message").value.trim();
    const openDate = document.getElementById("openDate").value; // Format: YYYY-MM-DD

    // Basic client-side validation
    if (!title || !message || !openDate) {
        alert("Please fill out all fields.");
        return;
    }

    submitButton.disabled = true; // Disable button to prevent double clicks
    submitButton.textContent = "Creating...";

    try {
        const res = await fetch("/api/capsules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, message, openDate })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`Server responded with status: ${res.status} - ${errorData.message || 'Unknown error'}`);
        }

        form.reset();   // clear form
        loadCapsules(); // reload list to show the new capsule
    } catch (error) {
        console.error("Failed to create capsule:", error);
        alert(`There was an error creating your capsule: ${error.message}. Please try again.`);
    } finally {
        submitButton.disabled = false; // Re-enable button
        submitButton.textContent = "Create Capsule";
    }
});

// Event listener for the whole capsule list to handle clicks on delete buttons
document.getElementById("capsuleList")?.addEventListener("click", async (e) => {
  // Check if the clicked element was a delete button
  if (e.target.classList.contains("delete-btn")) {
    const id = e.target.dataset.id; // Get the capsule ID from the data-id attribute

    // Ask the user for confirmation before deleting
    const isConfirmed = confirm("Are you sure you want to delete this capsule forever?");

    if (isConfirmed) {
      try {
        const res = await fetch(`/api/capsules/${id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          // If the server confirms deletion, reload the capsules to update the UI
          loadCapsules();
        } else {
          // Attempt to get more specific error message from the server
          const errorData = await res.json();
          alert(`Failed to delete the capsule: ${errorData.message || 'Unknown error.'}`);
        }
      } catch (error) {
        console.error("Error deleting capsule:", error);
        alert("An error occurred while trying to delete the capsule. Please check your network.");
      }
    }
  }
});