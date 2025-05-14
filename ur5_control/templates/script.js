document.addEventListener("DOMContentLoaded", () => {
    const MIN_VALUE = -3.141592;
    const MAX_VALUE = 3.141592;

    // Utility function to clamp a value within the defined range
    function clampValue(value) {
        if (value < MIN_VALUE) return MIN_VALUE;
        if (value > MAX_VALUE) return MAX_VALUE;
        return value;
    }

    // Handle increment and decrement buttons for Jogging and Pick & Place sections
    document.querySelectorAll(".side-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
            const controlDiv = event.target.parentElement;
            const inputField = controlDiv.querySelector(".axis-input");
            const isJogging = event.target.closest("#jogging");

            // Select the correct step input field based on the section
            const stepInput = isJogging
                ? document.querySelector(".dialog_input1")
                : document.querySelector(".dialog_input2");

            const stepValue = parseFloat(stepInput.value) || 1; // Default to 1 if no value is provided
            let currentValue = parseFloat(inputField.value) || 0;

            // Check if button is increment or decrement and adjust based on stepValue
            if (button.textContent === "+") {
                currentValue += stepValue;
            } else if (button.textContent === "-") {
                currentValue -= stepValue;
            }

            // Clamp the value within the allowed range
            inputField.value = clampValue(currentValue).toFixed(6);

            // Send data if in the jogging section
            if (isJogging) {
                sendJoggingData();
            }
        });
    });

    // Ensure manual inputs stay within the valid range
    document.querySelectorAll(".axis-input").forEach((inputField) => {
        inputField.addEventListener("blur", () => {
            const inputValue = parseFloat(inputField.value) || 0;
            inputField.value = clampValue(inputValue).toFixed(6);
        });
    });

    // Define the home position values for each axis
    const homePosition = [0.0, -2.3911, 2.40855, -3.14159, -1.58825, 3.14159];

    // Select the Home Pos button and add event listener
    document.querySelector(".home-btn").addEventListener("click", () => {
        const axisInputs = document.querySelectorAll("#jogging .axis-input");

        axisInputs.forEach((input, index) => {
            input.value = homePosition[index].toFixed(6); // Set input to home position
        });

        sendJoggingData();
    });

    // Function to send jogging data to the server
    function sendJoggingData() {
        const joggingValues = Array.from(
            document.querySelectorAll("#jogging .axis-input")
        ).map((input) => parseFloat(input.value) || 0.0);

        console.log("Jogging Values (as floats):", joggingValues);
        fetch("http://192.168.103.161:5000/send_jogging_data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ joggingValues }),
        })
            .then((response) => response.json())
            .then((data) => console.log("Jogging response:", data))
            .catch((error) => console.error("Error sending jogging data:", error));
    }

    // Load1 and Load2 button functionality
    document.querySelectorAll(".load-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const isLoad1 = button.textContent === "Load1";

            // Fetch the coordinates from the server
            fetch("http://192.168.103.161:5000/get_coordinates")
                .then((response) => response.json())
                .then((values) => {
                    if (values.length !== 6) {
                        console.error("Invalid data received. Expected 6 values.");
                        return;
                    }

                    // Determine the column (Load1 or Load2)
                    const columnIndex = isLoad1 ? 0 : 1;

                    // Get all inputs for "Pick & Place"
                    const ppContainer = document.querySelector("#pick-place");
                    const inputs = ppContainer.querySelectorAll(".axis-input");

                    // Map values to the correct column
                    for (let i = 0; i < 6; i++) {
                        const inputIndex = i * 2 + columnIndex; // Calculate index for each joint's respective column
                        const inputField = inputs[inputIndex];
                        inputField.value = clampValue(values[i]).toFixed(6);
                    }
                })
                .catch((error) => console.error("Error fetching coordinates:", error));
        });
    });

    // Pick & Place Section - Send data when "Run" button is clicked
    document.querySelector("#pick-place .run_button").addEventListener("click", () => {
        // Collect all input fields in the Pick & Place container
        const inputs = document.querySelectorAll("#pick-place .axis-input");
    
        // Initialize two arrays for the two columns
        const column1Values = [];
        const column2Values = [];
    
        // Populate the column arrays
        inputs.forEach((input, index) => {
            const value = parseFloat(input.value) || 0.0;
            if (index % 2 === 0) {
                // Even index -> Column 1
                column1Values.push(value);
            } else {
                // Odd index -> Column 2
                column2Values.push(value);
            }
        });
    
        // Combine both columns into a single list
        const combinedValues = [...column1Values, ...column2Values];
    
        console.log("Combined Pick & Place Values:", combinedValues);
    
        // Send the combined list to the server
        fetch("http://192.168.103.161:5000/send_pick_place_data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ pickPlaceValues: combinedValues }),
        })
            .then((response) => response.json())
            .then((data) => console.log("Pick & Place response:", data))
            .catch((error) =>
                console.error("Error sending pick & place data:", error)
            );
    });
        
});