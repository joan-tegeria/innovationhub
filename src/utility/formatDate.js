export const formatDate = (dateObj) => {
    // Check if dateObj exists and is a valid date
    if (!dateObj || !dateObj.format) {
        console.warn("Invalid date object provided to formatDate:", dateObj);
        return null;
    }
    return dateObj.format("YYYY-MM-DDTHH:mm:ssZ");
};

export const formatBirthDate = (dateObj) => {
    // Check if dateObj exists and is a valid date
    if (!dateObj || !dateObj.format) {
        console.warn("Invalid date object provided to formatBirthDate:", dateObj);
        return null;
    }
    return dateObj.format("YYYY-MM-DD");
};