// ─── Configuration ───────────────────────────────────────
// This is the URL of your Flask backend
// During local development it runs on port 5000
// Change this to your EC2 URL when you deploy to AWS

document.addEventListener("DOMContentLoaded", () => {
    const BACKEND_URL = "/image";

    // ─── Get DOM Elements ─────────────────────────────────────
    const dropZone         = document.getElementById("dropZone");
    const fileInput        = document.getElementById("fileInput");
    const previewContainer = document.getElementById("previewContainer");
    const previewImage     = document.getElementById("previewImage");
    const removeBtn        = document.getElementById("removeBtn");
    const analyzeBtn       = document.getElementById("analyzeBtn");
    const resultSection    = document.getElementById("resultSection");
    const loadingState     = document.getElementById("loadingState");
    const resultCard       = document.getElementById("resultCard");
    const resultBadge      = document.getElementById("resultBadge");
    const resultLabel      = document.getElementById("resultLabel");
    const resultDescription= document.getElementById("resultDescription");
    const confidenceValue  = document.getElementById("confidenceValue");
    const confidenceFill   = document.getElementById("confidenceFill");
    const errorCard        = document.getElementById("errorCard");
    const errorMessage     = document.getElementById("errorMessage");
    const tryAgainBtn      = document.getElementById("tryAgainBtn");
    const errorRetryBtn    = document.getElementById("errorRetryBtn");

    // ─── State ────────────────────────────────────────────────
    // We store the selected file here so we can send it later
    let selectedFile = null;

    // ─── Drag and Drop ────────────────────────────────────────

    // When user drags a file over the drop zone
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault(); // needed to allow drop
        dropZone.classList.add("drag-over");
    });

    // When user drags file away without dropping
    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("drag-over");
    });

    // When user drops the file
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");

        // Get the file from the drop event
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelected(file);
    });

    // Clicking anywhere on the drop zone opens the file picker
    dropZone.addEventListener("click", () => {
        fileInput.click();
    });

    // When user picks a file using the file browser
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (file) handleFileSelected(file);
    });

    // ─── Handle File Selected ─────────────────────────────────
    function handleFileSelected(file) {

        // Only accept image files
        if (!file.type.startsWith("image/")) {
            alert("Please upload an image file (JPG, PNG, WEBP)");
            return;
        }

        // Only accept files under 10MB
        if (file.size > 10 * 1024 * 1024) {
            alert("File is too large. Please upload an image under 10MB.");
            return;
        }

        // Store the file so we can send it when user clicks Analyze
        selectedFile = file;

        // Show a preview of the selected image
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewContainer.classList.add("visible");
            dropZone.style.display = "none"; // hide drop zone when preview is shown
        };
        reader.readAsDataURL(file);

        // Enable the analyze button
        analyzeBtn.disabled = false;

        // Hide any previous results
        resetResults();
    }

    // ─── Remove Selected Image ────────────────────────────────
    removeBtn.addEventListener("click", () => {
        selectedFile = null;
        previewImage.src = "";
        previewContainer.classList.remove("visible");
        dropZone.style.display = ""; // show drop zone again
        analyzeBtn.disabled = true;
        fileInput.value = ""; // reset file input
        resetResults();
    });

    // ─── Analyze Button Click ─────────────────────────────────
    analyzeBtn.addEventListener("click", () => {
        if (!selectedFile) return;
        sendImageToBackend(selectedFile);
    });

    // ─── Send Image to Flask Backend ─────────────────────────
    async function sendImageToBackend(file) {

        // Show result section and loading state
        resultSection.classList.add("visible");
        showLoading();

        // Wrap the image in a FormData object
        // This is the standard way to send files over HTTP
        const formData = new FormData();
        formData.append("image", file);

        try {
            // Send POST request to Flask /predict endpoint
            const response = await fetch(BACKEND_URL, {
                method: "POST",
                body: formData
                // Do NOT set Content-Type header when sending FormData
                // The browser sets it automatically with the correct boundary
            });

            // If the server returned an error status code
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            // Parse the JSON response from Flask
            // Expected format: { "label": "artificial", "confidence": 94.23 }
            const data = await response.json();

            // Display the result
            showResult(data);

        } catch (error) {
            // Something went wrong — show error card
            showError(error.message);
        }
    }

    // ─── Show Result ──────────────────────────────────────────
    function showResult(data) {
        hideLoading();

        // Determine if AI generated or real
        // The model returns "artificial" for AI images and "human" for real ones
        const isAI = data.label === "artificial";

        // Set badge
        resultBadge.textContent = isAI ? "⚠ AI Generated" : "✓ Real Image";
        resultBadge.className = `result-badge ${isAI ? "ai" : "real"}`;

        // Set label
        resultLabel.textContent = isAI ? "AI Generated" : "Real Image";
        resultLabel.className = `result-label ${isAI ? "ai" : "real"}`;

        // Set description
        resultDescription.textContent = isAI
            ? "Our model detected patterns consistent with AI-generated imagery. This image was likely created using an AI image generation tool such as Midjourney, DALL-E, or Stable Diffusion."
            : "Our model found no significant indicators of AI generation. This image appears to be a real photograph or human-created artwork.";

        // Set confidence score
        const confidence = data.confidence;
        confidenceValue.textContent = `${confidence}%`;

        // Animate the confidence bar
        confidenceFill.className = `confidence-fill ${isAI ? "ai" : "real"}`;
        setTimeout(() => {
            confidenceFill.style.width = `${confidence}%`;
        }, 100); // small delay so the animation is visible

        // Show result card
        resultCard.classList.add("visible");
    }

    // ─── Show Error ───────────────────────────────────────────
    function showError(message) {
        hideLoading();
        errorMessage.textContent = message || "Could not connect to the prediction server. Make sure the backend is running on port 5000.";
        errorCard.classList.add("visible");
    }

    // ─── Try Again Buttons ────────────────────────────────────
    tryAgainBtn.addEventListener("click", resetAll);
    errorRetryBtn.addEventListener("click", resetAll);

    // ─── Helper Functions ─────────────────────────────────────
    function showLoading() {
        loadingState.classList.add("visible");
        resultCard.classList.remove("visible");
        errorCard.classList.remove("visible");
    }

    function hideLoading() {
        loadingState.classList.remove("visible");
    }

    function resetResults() {
        resultSection.classList.remove("visible");
        loadingState.classList.remove("visible");
        resultCard.classList.remove("visible");
        errorCard.classList.remove("visible");
        confidenceFill.style.width = "0%";
    }

    function resetAll() {
        // Reset everything back to initial state
        selectedFile = null;
        previewImage.src = "";
        previewContainer.classList.remove("visible");
        dropZone.style.display = "";
        analyzeBtn.disabled = true;
        fileInput.value = "";
        resetResults();
    }
});