/**
 * Utility functions for the frontend application
 */

const Utils = {
    /**
     * Show loading state on a button
     * @param {HTMLButtonElement} button 
     * @param {string} loadingText 
     * @returns {Object} original state to restore
     */
    setLoading(button, loadingText = 'Processing...') {
        const originalText = button.textContent;
        const originalDisabled = button.disabled;

        button.textContent = loadingText;
        button.disabled = true;

        return {
            restore: () => {
                button.textContent = originalText;
                button.disabled = originalDisabled;
            }
        };
    },

    /**
     * Custom fetch wrapper with default headers and error handling
     * @param {string} url 
     * @param {Object} options 
     */
    async apiFetch(url, options = {}) {
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Fetch Error:', error);
            throw error;
        }
    },

    /**
     * Show a simple alert (can be upgraded to a toast system later)
     */
    showAlert(message, type = 'info') {
        // Simple alert for now, but centralizing it allows easy UI upgrades
        alert(message);
    }
};

export default Utils;
